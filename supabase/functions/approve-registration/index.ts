import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, subdomain, full_name, whatsapp_number } = body;

    // Validasi: email, subdomain, full_name WAJIB. Password OPSIONAL.
    if (!email || !subdomain || !full_name) {
      return new Response(
        JSON.stringify({ error: "Field wajib: email, subdomain, full_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate password otomatis jika tidak disediakan
    const finalPassword = password || Math.random().toString(36).slice(-8) + 'A1!';

    const supabaseSiput = createClient(
      Deno.env.get("SIPUT_URL")!,
      Deno.env.get("SIPUT_SERVICE_ROLE_KEY")!
    );

    const { data: authData, error: authError } = await supabaseSiput.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { full_name, subdomain, whatsapp_number },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Gagal membuat akun: " + authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    const { error: insertError } = await supabaseSiput
      .from("registrations")
      .insert({
        email,
        full_name,
        whatsapp_number: whatsapp_number || null,
        subdomain,
        status: "approved",
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      await supabaseSiput.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Gagal menyimpan data: " + insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Kirim email dengan password (baik yang dikirim maupun yang digenerate)
    if (Deno.env.get("RESEND_API_KEY") && Deno.env.get("FROM_EMAIL")) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
      const tenantUrl = `https://${subdomain}.siput.rsch.my.id`;
      await resend.emails.send({
        from: Deno.env.get("FROM_EMAIL")!,
        to: [email],
        subject: "Selamat! Pendaftaran Anda Disetujui",
        html: `
          <h1>Halo ${full_name},</h1>
          <p>Pendaftaran Anda untuk <strong>${subdomain}</strong> telah disetujui.</p>
          <p>Klik link di bawah untuk mengakses dashboard sekolah Anda:</p>
          <p><a href="${tenantUrl}" target="_blank">${tenantUrl}</a></p>
          <p><strong>Password sementara Anda: ${finalPassword}</strong></p>
          <p>Segera ganti password setelah login untuk keamanan.</p>
          <p>Salam,<br>Tim SIPUT</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pendaftaran berhasil disetujui",
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
