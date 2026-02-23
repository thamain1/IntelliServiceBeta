import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EstimateDecisionRequest {
  token: string;
  decision: 'accepted' | 'rejected';
  decided_name: string;
  comment?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const requestData: EstimateDecisionRequest = await req.json();
    const { token, decision, decided_name, comment } = requestData;

    if (!token || !decision || !decided_name) {
      return new Response(
        JSON.stringify({ error: 'Token, decision, and decided_name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['accepted', 'rejected'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'Decision must be "accepted" or "rejected"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Hash the token
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Find active link by token hash
    const { data: publicLink, error: linkError } = await supabase
      .from('estimate_public_links')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .single();

    if (linkError || !publicLink) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired link' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check expiration
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This estimate link has expired' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if decision already made
    if (publicLink.decision) {
      return new Response(
        JSON.stringify({
          error: 'Decision already made',
          existing_decision: publicLink.decision,
          decided_at: publicLink.decided_at,
          decided_name: publicLink.decided_name,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get client IP and user agent
    const clientIp = req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Update public link with decision
    const { error: updateLinkError } = await supabase
      .from('estimate_public_links')
      .update({
        decision,
        decided_at: new Date().toISOString(),
        decided_name,
        decided_ip: clientIp,
        decided_user_agent: userAgent,
        decision_comment: comment || null,
      })
      .eq('id', publicLink.id);

    if (updateLinkError) {
      console.error('Error updating link:', updateLinkError);
      return new Response(
        JSON.stringify({ error: 'Failed to record decision', details: updateLinkError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update estimate status and date
    const updateData: Record<string, unknown> = {
      status: decision,
    };

    if (decision === 'accepted') {
      updateData.accepted_date = new Date().toISOString();
    } else if (decision === 'rejected') {
      updateData.rejected_date = new Date().toISOString();
    }

    const { error: updateEstimateError } = await supabase
      .from('estimates')
      .update(updateData)
      .eq('id', publicLink.estimate_id);

    if (updateEstimateError) {
      console.error('Error updating estimate:', updateEstimateError);
      // Don't fail the request if estimate update fails, decision is recorded in link
    }

    // Log event
    await supabase
      .from('estimate_events')
      .insert({
        estimate_id: publicLink.estimate_id,
        link_id: publicLink.id,
        event_type: decision,
        metadata: {
          decided_name,
          comment: comment || null,
          ip: clientIp,
        },
        actor_type: 'customer',
        actor_ip: clientIp,
        actor_user_agent: userAgent,
      });

    // Fetch updated estimate details
    const { data: estimate } = await supabase
      .from('estimates')
      .select(`
        id,
        estimate_number,
        job_title,
        total_amount,
        customers(name)
      `)
      .eq('id', publicLink.estimate_id)
      .single();

    // Trigger notification to dispatch/admin staff
    try {
      const notificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-estimate-notification`;
      const notificationResponse = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          estimate_id: publicLink.estimate_id,
          decision,
          decided_name,
          send_email: true,
        }),
      });

      if (!notificationResponse.ok) {
        console.error('Failed to send notification:', await notificationResponse.text());
      }
    } catch (notifError) {
      console.error('Error calling notification function:', notifError);
      // Don't fail the main request if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        decision,
        decided_at: new Date().toISOString(),
        estimate: {
          id: estimate?.id,
          estimate_number: estimate?.estimate_number,
          job_title: estimate?.job_title,
          total_amount: estimate?.total_amount,
        },
        message: `Estimate ${decision} successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
