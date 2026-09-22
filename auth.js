/* auth.js — вход в админку по паролю.
   Пароль используется ещё и как ключ шифрования данных. */

(function () {
  const ADMIN_PASSWORD = "Sorryf"; // 👈 ЗАМЕНИ НА СВОЙ ПАРОЛЬ
  const SESSION_KEY = "sorryfworryf";
  const SESSION_TTL = 1000 * 60 * 60; // 1 час

  function bindLogout() {
    const logout = document.getElementById("logoutBtn");
    if (logout) {
      logout.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem(SESSION_KEY);
        CryptoBox.clearKey();
        location.reload();
      });
    }
  }

  function hasValidSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.expires || Date.now() > data.expires) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    } catch { return false; }
  }

  function buildOverlay() {
    document.documentElement.style.visibility = "hidden";
    const overlay = document.createElement("div");
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
      <div class="auth-box">
        <h2>🔒 Вход в админ-панель</h2>
        <p class="auth-hint">Пароль используется также как ключ шифрования данных.</p>
        <input type="password" id="authPass" placeholder="Пароль" autocomplete="off">
        <button id="authBtn">Войти</button>
        <p class="auth-error" id="authError"></p>
        <a href="index.html" class="auth-back">← Назад в чат</a>
      </div>
    `;
    document.body.appendChild(overlay);

    const passInput = overlay.querySelector("#authPass");
    const btn = overlay.querySelector("#authBtn");
    const err = overlay.querySelector("#authError");

    async function tryLogin() {
      const val = passInput.value;
      if (val === ADMIN_PASSWORD) {
        // прогрев ключа — чтобы admin.js сразу мог расшифровывать
        try { await CryptoBox.encrypt("warmup", val); } catch {}
        window.__ADMIN_PASSWORD__ = val;
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          expires: Date.now() + SESSION_TTL
        }));
        overlay.remove();
        document.documentElement.style.visibility = "visible";
        document.dispatchEvent(new CustomEvent("admin-auth-ready"));
      } else {
        err.textContent = "❌ Неверный пароль";
        passInput.value = "";
        passInput.focus();
        setTimeout(() => { err.textContent = ""; }, 2000);
      }
    }

    btn.addEventListener("click", tryLogin);
    passInput.addEventListener("keydown", e => {
      if (e.key === "Enter") tryLogin();
    });
    passInput.focus();
  }

  function init() {
    bindLogout();
    if (hasValidSession()) {
      // сессия уже была — сразу передаём пароль в admin.js
      window.__ADMIN_PASSWORD__ = ADMIN_PASSWORD;
      document.dispatchEvent(new CustomEvent("admin-auth-ready"));
    } else {
      buildOverlay();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
