import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !callingUser) {
      throw new Error("Invalid or expired token");
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', callingUser.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Admin access required" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email, password, fullName, role, phone, laborCostPerHour } = await req.json();

    if (!email || !password || !fullName || !role) {
      throw new Error("email, password, fullName, and role are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const validRoles = ['admin', 'dispatcher', 'technician'];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role specified");
    }

    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    const profileData: Record<string, unknown> = {
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
      phone: phone || null,
    };

    if (role === 'technician' && laborCostPerHour) {
      profileData.labor_cost_per_hour = parseFloat(laborCostPerHour);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error("Profile error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    console.log(`Admin user creation: ${callingUser.email} created user ${email} with role ${role}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role: role
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = errorMessage.includes("Unauthorized") || errorMessage.includes("Invalid or expired") ? 403 : 400;
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});