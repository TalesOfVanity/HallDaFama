import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const username = String(body.username || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
    const password = String(body.password || "");

    if (!/^[a-z0-9._-]{3,30}$/.test(username) || !password) {
      return json({ error: "Usuário ou senha inválidos." }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Descobre somente internamente qual usuário do Auth pertence ao @username.
    // O e-mail nunca é devolvido ao navegador.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      console.error("profile lookup:", profileError.message);
      return json({ error: "Não foi possível entrar agora." }, 500);
    }

    // Mensagem deliberadamente igual para usuário inexistente e senha incorreta.
    if (!profile?.id) {
      return json({ error: "Usuário ou senha inválidos." }, 400);
    }

    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;

    if (userError || !email) {
      if (userError) console.error("auth user lookup:", userError.message);
      return json({ error: "Usuário ou senha inválidos." }, 400);
    }

    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return json({ error: "Usuário ou senha inválidos." }, 400);
    }

    return json({
      user_id: data.user.id,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }
    });
  } catch (err) {
    console.error(err);
    return json({ error: "Erro interno ao realizar login." }, 500);
  }
});
