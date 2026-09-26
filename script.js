(() => {
  "use strict";

  const LICENSE_SERVER_URL = "https://4utowolves-license.4autowolves.workers.dev";

  const AD_WAIT_MS = 20 * 1000; // time given for the popunder to open before releasing the token

  const generateButton = document.getElementById("generateButton");
  const statusEl = document.getElementById("status");
  const tokenBox = document.getElementById("tokenBox");
  const tokenOutput = document.getElementById("tokenOutput");
  const copyButton = document.getElementById("copyButton");

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function showToken(token) {
    tokenOutput.value = token;
    tokenBox.classList.remove("hidden");
    setStatus("Token pronto! Copie e cole na extensão.");
  }

  async function createToken() {
    const response = await fetch(LICENSE_SERVER_URL + "/token/create", { method: "POST" });
    if (!response.ok) throw new Error("create_failed");
    return response.json();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handleGenerateClick() {
    if (!LICENSE_SERVER_URL) {
      setStatus("Servidor de licença ainda não configurado. Volte em breve.");
      return;
    }
    generateButton.disabled = true;
    tokenBox.classList.add("hidden");
    setStatus("Preparando...");
    try {
      // The Onclick/Popunder tag (loaded in <head>) fires the ad automatically
      // on click. We wait a bit before releasing the token to give it time to open.
      const data = await createToken();
      setStatus("Anúncio aberto! Liberando seu token em instantes...");
      await sleep(AD_WAIT_MS);
      showToken(data.token);
    } catch {
      setStatus("Não foi possível gerar o token. Tente novamente em instantes.");
      generateButton.disabled = false;
    }
  }

  generateButton.addEventListener("click", () => void handleGenerateClick());

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(tokenOutput.value);
      copyButton.textContent = "Copiado!";
      setTimeout(() => { copyButton.textContent = "Copiar"; }, 2000);
    } catch {
      tokenOutput.select();
      document.execCommand("copy");
    }
  });
})();
