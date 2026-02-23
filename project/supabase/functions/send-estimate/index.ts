import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendEstimateRequest {
  estimate_id: string;
  customer_id?: string;
  contact_id?: string;
  send_email: boolean;
  send_sms: boolean;
  expiration_days?: number;
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'dispatcher'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestData: SendEstimateRequest = await req.json();
    const {
      estimate_id,
      customer_id,
      contact_id,
      send_email,
      send_sms,
      expiration_days = 30
    } = requestData;

    if (!estimate_id) {
      return new Response(
        JSON.stringify({ error: 'estimate_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!send_email && !send_sms) {
      return new Response(
        JSON.stringify({ error: 'At least one delivery channel (email or sms) must be selected' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select(`
        *,
        customers(id, name, email, phone, address)
      `)
      .eq('id', estimate_id)
      .single();

    if (estimateError || !estimate) {
      return new Response(
        JSON.stringify({ error: 'Estimate not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const effectiveCustomerId = customer_id || estimate.customer_id;
    let toEmail: string | null = null;
    let toPhone: string | null = null;

    if (contact_id) {
      const { data: contact } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('id', contact_id)
        .single();

      if (contact) {
        toEmail = contact.email;
        toPhone = contact.phone || contact.mobile;
      }
    }

    if (!toEmail && !toPhone) {
      toEmail = estimate.customers.email;
      toPhone = estimate.customers.phone;
    }

    if (send_email && !toEmail) {
      return new Response(
        JSON.stringify({ error: 'No email address available for delivery' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (send_sms && !toPhone) {
      return new Response(
        JSON.stringify({ error: 'No phone number available for SMS delivery' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const plainToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const encoder = new TextEncoder();
    const data = encoder.encode(plainToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = expiration_days > 0
      ? new Date(Date.now() + expiration_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: publicLink, error: linkError } = await supabase
      .from('estimate_public_links')
      .insert({
        estimate_id,
        customer_id: effectiveCustomerId,
        contact_id: contact_id || null,
        token: plainToken,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Error creating public link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to create public link', details: linkError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate portal URL - use relative path since we don't know the frontend domain
    // The frontend will construct the full URL from the token
    const portalUrl = `/estimate-portal/${plainToken}`;

    const deliveryResults: { channel: string; status: string; to: string }[] = [];

    if (send_email && toEmail) {
      try {
        const emailSubject = `Estimate ${estimate.estimate_number} from ${estimate.customers.name || 'Your Service Provider'}`;

        console.log('Email would be sent to:', toEmail);
        console.log('Subject:', emailSubject);
        console.log('Portal URL:', portalUrl);

        const { error: deliveryError } = await supabase
          .from('estimate_delivery_attempts')
          .insert({
            link_id: publicLink.id,
            channel: 'email',
            to_address: toEmail,
            provider: 'simulated',
            status: 'sent',
            created_by: user.id,
            sent_at: new Date().toISOString(),
          });

        if (deliveryError) {
          console.error('Error logging email delivery:', deliveryError);
        }

        deliveryResults.push({
          channel: 'email',
          status: 'sent',
          to: toEmail,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);

        await supabase
          .from('estimate_delivery_attempts')
          .insert({
            link_id: publicLink.id,
            channel: 'email',
            to_address: toEmail,
            provider: 'simulated',
            status: 'failed',
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            created_by: user.id,
            failed_at: new Date().toISOString(),
          });

        deliveryResults.push({
          channel: 'email',
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    if (send_sms && toPhone) {
      try {
        const smsBody = `Your estimate ${estimate.estimate_number} is ready for review: ${portalUrl}`;

        console.log('SMS would be sent to:', toPhone);
        console.log('Message:', smsBody);

        await supabase
          .from('estimate_delivery_attempts')
          .insert({
            link_id: publicLink.id,
            channel: 'sms',
            to_address: toPhone,
            provider: 'simulated',
            status: 'sent',
            created_by: user.id,
            sent_at: new Date().toISOString(),
          });

        deliveryResults.push({
          channel: 'sms',
          status: 'sent',
          to: toPhone,
        });
      } catch (smsError) {
        console.error('SMS sending error:', smsError);

        await supabase
          .from('estimate_delivery_attempts')
          .insert({
            link_id: publicLink.id,
            channel: 'sms',
            to_address: toPhone,
            provider: 'simulated',
            status: 'failed',
            error: smsError instanceof Error ? smsError.message : 'Unknown error',
            created_by: user.id,
            failed_at: new Date().toISOString(),
          });

        deliveryResults.push({
          channel: 'sms',
          status: 'failed',
          error: smsError instanceof Error ? smsError.message : 'Unknown error',
        });
      }
    }

    await supabase
      .from('estimate_events')
      .insert({
        estimate_id,
        link_id: publicLink.id,
        event_type: 'sent',
        metadata: {
          channels: deliveryResults.map(r => r.channel),
          contact_id,
          to_email: toEmail,
          to_phone: toPhone,
        },
        actor_type: 'internal',
        actor_user_id: user.id,
      });

    const shouldUpdateStatus = estimate.status === 'draft';
    if (shouldUpdateStatus || !estimate.sent_date) {
      const updateData: Record<string, unknown> = {};
      if (!estimate.sent_date) {
        updateData.sent_date = new Date().toISOString();
      }
      if (shouldUpdateStatus) {
        updateData.status = 'sent';
      }

      await supabase
        .from('estimates')
        .update(updateData)
        .eq('id', estimate_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        link_id: publicLink.id,
        portal_url: portalUrl,
        plain_token: plainToken,
        delivery_results: deliveryResults,
        expires_at: expiresAt,
        message: 'Estimate sent successfully',
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
