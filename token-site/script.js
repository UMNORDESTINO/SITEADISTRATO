(() => {
  "use strict";

  // Fill in after deploying license-server/ (see license-server/README.md).
  const LICENSE_SERVER_URL = "";

  // Fill in once the Monetag zone exists. Check Monetag's own docs for the
  // exact macro name their Direct/Smart Link zones use to echo back a custom
  // id in the postback (the license server expects it as "ymid" in
  // /monetag/postback?ymid=... - rename on both sides together if Monetag
  // calls it something else, e.g. "subid" or "click_id").
  const MONETAG_ZONE_URL = "";
  const MONETAG_CLICK_ID_PARAM = "ymid";

  const SESSION_STORAGE_KEY = "4utowolves-token-session";
  const POLL_INTERVAL_MS = 2500;
  const POLL_TIMEOUT_MS = 5 * 60 * 1000; // give up after 5 minutes of polling

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

  async function createSession() {
    const response = await fetch(LICENSE_SERVER_URL + "/token/create", { method: "POST" });
    if (!response.ok) throw new Error("create_failed");
    const data = await response.json();
    return data.sessionId;
  }

  async function fetchStatus(sessionId) {
    const response = await fetch(
      LICENSE_SERVER_URL + "/token/status?session=" + encodeURIComponent(sessionId),
    );
    if (!response.ok) throw new Error("status_failed");
    return response.json();
  }

  async function pollUntilReady(sessionId) {
    const startedAt = Date.now();
    setStatus("Aguardando a confirmação do anúncio...");
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      let status;
      try {
        status = await fetchStatus(sessionId);
      } catch {
        setStatus("Falha ao verificar o status. Tentando novamente...");
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      if (status.status === "ready" && status.token) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        showToken(status.token);
        return;
      }
      if (status.status === "expired") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setStatus("Essa sessão expirou. Clique no botão para tentar de novo.");
        generateButton.disabled = false;
        return;
      }
      await sleep(POLL_INTERVAL_MS);
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setStatus("Não recebemos a confirmação a tempo. Tente novamente.");
    generateButton.disabled = false;
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
      const sessionId = await createSession();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);

      if (!MONETAG_ZONE_URL) {
        // Ad network not wired in yet: fall back to just polling, so the
        // token pipeline (create -> postback -> verify) can still be tested
        // end to end once /monetag/postback is triggered manually or by hand.
        setStatus("Anúncio ainda não configurado. Aguardando confirmação manual...");
        void pollUntilReady(sessionId);
        return;
      }

      const separator = MONETAG_ZONE_URL.includes("?") ? "&" : "?";
      const adUrl = MONETAG_ZONE_URL + separator + MONETAG_CLICK_ID_PARAM + "=" + encodeURIComponent(sessionId);
      window.location.href = adUrl;
    } catch {
      setStatus("Não foi possível iniciar. Tente novamente em instantes.");
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

  // Resume polling if the user is coming back from the ad (page reload/redirect).
  const pendingSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (pendingSession && LICENSE_SERVER_URL) {
    generateButton.disabled = true;
    void pollUntilReady(pendingSession);
  }
})();
