import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function clientIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip");
  const real = req.headers.get("x-real-ip");
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return cf || real || forwarded || "unknown";
}

function networkKey(ip: string) {
  if (ip.includes(".")) {
    const p = ip.split(".");
    return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0/24` : ip;
  }
  if (ip.includes(":")) {
    const p = ip.split(":");
    return `${p.slice(0, 4).join(":")}::/64`;
  }
  return ip;
}

async function hmac(value: string, pepper: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const browserId = String(body.browser_id || "").trim();
    if (!email || password.length < 6 || !browserId) return json({ error: "Dados de cadastro inválidos." }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pepper = Deno.env.get("SECURITY_PEPPER");
    if (!pepper) return json({ error: "SECURITY_PEPPER não configurado." }, 500);

    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { data: {
        display_name: String(body.display_name || "").trim(),
        country: String(body.country || "").trim(),
        participation_type: String(body.participation_type || "interpreter")
      }}
    });
    if (error) return json({ error: error.message }, 400);
    if (!data.user) return json({ error: "Conta não criada." }, 400);

    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") || "unknown";
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const event = {
      user_id: data.user.id,
      event_type: "signup",
      ip_hmac: await hmac(`ip:${ip}`, pepper),
      network_hmac: await hmac(`network:${networkKey(ip)}`, pepper),
      browser_hmac: await hmac(`browser:${browserId}`, pepper),
      user_agent_hmac: await hmac(`ua:${ua}`, pepper)
    };
    const { error: logError } = await admin.from("account_security_events").insert(event);
    if (logError) console.error("security log:", logError.message);

    return json({ user_id: data.user.id, session: data.session ? {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    } : null });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno." }, 500);
  }
});
