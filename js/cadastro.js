import { supabase } from "./supabase.js";
import { setStatus } from "./utils.js";

const form = document.querySelector("#register-form");
const status = document.querySelector("#register-status");

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        country,
        participation_type: participationType
      }
    }
  });

  if (error) {
    setStatus(status, error.message, "error");
    return;
  }

  if (!data.session) {
    setStatus(
      status,
      "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
      "success"
    );
    form.reset();
    return;
  }

  window.location.href = "index.html";
});
