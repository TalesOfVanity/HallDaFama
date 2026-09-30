import { supabase } from "./supabase.js";
import { setStatus } from "./utils.js";

const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const identifier = form.identifier.value.trim();
  const password = form.password.value;

  if (!identifier || !password) {
    setStatus(status, "Informe seu e-mail ou @username e a senha.", "error");
    return;
  }

  setStatus(status, "Entrando...");

  try {
    // Mantém compatibilidade: quem quiser ainda pode entrar pelo e-mail.
    if (identifier.includes("@") && !identifier.startsWith("@")) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password
      });

      if (error) throw new Error("E-mail ou senha inválidos.");
    } else {
      const username = identifier.replace(/^@/, "").toLowerCase();

      if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
        throw new Error("@username inválido.");
      }

      const { data, error } = await supabase.functions.invoke("login-with-username", {
        body: { username, password }
      });

      if (error) {
        let message = "Usuário ou senha inválidos.";
        try {
          const context = error.context;
          if (context && typeof context.json === "function") {
            const payload = await context.json();
            if (payload?.error) message = payload.error;
          }
        } catch (_) {}
        throw new Error(message);
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.session?.access_token || !data?.session?.refresh_token) {
        throw new Error("Não foi possível iniciar sua sessão.");
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });

      if (sessionError) throw sessionError;
    }

    window.location.href = "index.html";
  } catch (error) {
    setStatus(status, error?.message || "Não foi possível entrar.", "error");
  }
});
