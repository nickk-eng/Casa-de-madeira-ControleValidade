"use strict";
const form = document.getElementById("login-form"),
  senha = document.getElementById("senha"),
  mostrar = document.getElementById("mostrar"),
  entrar = document.getElementById("entrar"),
  mensagem = document.getElementById("login-mensagem");
mostrar.onclick = () => {
  const visivel = senha.type === "password";
  senha.type = visivel ? "text" : "password";
  mostrar.textContent = visivel ? "Ocultar senha" : "Mostrar senha";
  mostrar.setAttribute("aria-pressed", String(visivel));
};
form.onsubmit = async (e) => {
  e.preventDefault();
  entrar.disabled = true;
  mensagem.textContent = "Entrando…";
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: document.getElementById("usuario").value.trim(),
        senha: senha.value,
      }),
    });
    if (!res.ok) {
      const dados = await res.json();
      throw new Error(dados.error || "Não foi possível entrar.");
    }
    window.location.replace("/");
  } catch (err) {
    mensagem.textContent =
      err.message === "Failed to fetch"
        ? "Verifique sua conexão e tente novamente."
        : err.message;
  } finally {
    entrar.disabled = false;
  }
};
