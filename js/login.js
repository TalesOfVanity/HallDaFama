import { supabase } from "./supabase.js";
import { setStatus } from "./utils.js";

const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value;

  setStatus(status, "Entrando...");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setStatus(status, error.message, "error");
    return;
  }

  window.location.href = "index.html";
});
