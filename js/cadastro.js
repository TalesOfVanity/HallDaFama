import { supabase } from "./supabase.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { setStatus } from "./utils.js";

const form = document.querySelector("#register-form");
const status = document.querySelector("#register-status");
const BROWSER_KEY = "tov_browser_id";

function getBrowserId() {
  let id = localStorage.getItem(BROWSER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(BROWSER_KEY, id);
  }
  return id;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value;
  const displayName = form.display_name.value.trim();
  const country = form.country.value.trim();
  const participationType = form.participation_type?.value || "interpreter";

  if (password.length < 6) {
    setStatus(status, "A senha precisa ter pelo menos 6 caracteres.", "error");
    return;
  }

  setStatus(status, "Criando conta...");

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-with-security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
        country,
        participation_type: participationType,
        browser_id: getBrowserId()
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível criar a conta.");

    if (result.session?.access_token && result.session?.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      });
      if (error) throw error;
      location.href = "index.html";
      return;
    }

    setStatus(status, "Conta criada. Verifique seu e-mail para confirmar o cadastro.", "success");
    form.reset();
  } catch (error) {
    setStatus(status, error.message, "error");
  }
});
