/* admin.js — админ-панель. Все данные шифруются AES-GCM паролем админа. */

const DB = {
  get(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

let ADMIN_PASSWORD = null;

/* ---------- Табы ---------- */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

/* ---------- Утилиты шифрования ---------- */
async function enc(text) {
  if (!ADMIN_PASSWORD) throw new Error("Нет пароля");
  return await CryptoBox.encrypt(text, ADMIN_PASSWORD);
}

async function dec(payload) {
  if (!payload) return null;
  if (payload.enc) return await CryptoBox.decrypt(payload.enc, ADMIN_PASSWORD);
  return payload.plain || payload.content || payload.key || null;
}

function makeLabel(icon, name) { return `${icon} ${name}`; }

/* ---------- VPN ---------- */
async function addVPN() {
  const name = document.getElementById("vpnName").value.trim();
  const key = document.getElementById("vpnKey").value.trim();
  if (!key) { alert("Введите ключ"); return; }
  const data = DB.get("vpn", {});
  const finalName = name || `VPN #${Object.keys(data).length + 1}`;
  data[finalName] = {
    label: finalName,
    enc: await enc(key),
    date: new Date().toLocaleString("ru")
  };
  DB.set("vpn", data);
  document.getElementById("vpnName").value = "";
  document.getElementById("vpnKey").value = "";
  renderVPN();
}

function delVPN(name) {
  const data = DB.get("vpn", {});
  delete data[name];
  DB.set("vpn", data);
  renderVPN();
}

async function renderVPN() {
  const data = DB.get("vpn", {});
  const keys = Object.keys(data);
  const out = [];
  for (const name of keys) {
    const val = await dec(data[name]);
    out.push(`
      <li>
        <div class="info">
          <strong>📌 ${name}</strong>
          <small><code>${val || "🔒 ошибка расшифровки"}</code></small>
        </div>
        <button class="del" onclick="delVPN('${name.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`);
  }
  document.getElementById("vpnList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- Олимпиады ---------- */
async function addOlymp() {
  const name = document.getElementById("olympName").value.trim();
  const content = document.getElementById("olympContent").value.trim();
  if (!name || !content) { alert("Заполните поля"); return; }
  const data = DB.get("olympiads", {});
  data[name.toLowerCase()] = {
    label: makeLabel("📝", name),
    enc: await enc(content),
    date: new Date().toLocaleString("ru")
  };
  DB.set("olympiads", data);
  document.getElementById("olympName").value = "";
  document.getElementById("olympContent").value = "";
  renderOlymp();
}

function delOlymp(k) {
  const data = DB.get("olympiads", {});
  delete data[k];
  DB.set("olympiads", data);
  renderOlymp();
}

async function renderOlymp() {
  const data = DB.get("olympiads", {});
  const out = [];
  for (const k of Object.keys(data)) {
    const val = await dec(data[k]);
    out.push(`
      <li>
        <div class="info">
          <strong>${data[k].label || k}</strong>
          <small>${val ? val.slice(0, 80) + (val.length > 80 ? "…" : "") : "🔒 ошибка"}<br>${data[k].date}</small>
        </div>
        <button class="del" onclick="delOlymp('${k.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`);
  }
  document.getElementById("olympList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- ЦДЗ ---------- */
async function addDZ() {
  const s = document.getElementById("dzSubject").value.trim();
  const t = document.getElementById("dzTitle").value.trim();
  const c = document.getElementById("dzContent").value.trim();
  if (!s || !t || !c) { alert("Заполните поля"); return; }
  const data = DB.get("dz", {});
  const key = `${s.toLowerCase()}|${t.toLowerCase()}`;
  data[key] = {
    label: makeLabel("📚", `${s} — ${t}`),
    enc: await enc(c),
    date: new Date().toLocaleString("ru")
  };
  DB.set("dz", data);
  document.getElementById("dzSubject").value = "";
  document.getElementById("dzTitle").value = "";
  document.getElementById("dzContent").value = "";
  renderDZ();
}

function delDZ(k) {
  const data = DB.get("dz", {});
  delete data[k];
  DB.set("dz", data);
  renderDZ();
}

async function renderDZ() {
  const data = DB.get("dz", {});
  const out = [];
  for (const k of Object.keys(data)) {
    out.push(`
      <li>
        <div class="info">
          <strong>${data[k].label || k}</strong>
          <small>${data[k].date}</small>
        </div>
        <button class="del" onclick="delDZ('${k.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`);
  }
  document.getElementById("dzList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- Конспекты ---------- */
async function addKonsp() {
  const s = document.getElementById("konspSubject").value.trim();
  const t = document.getElementById("konspTitle").value.trim();
  const c = document.getElementById("konspContent").value.trim();
  if (!s || !t || !c) { alert("Заполните поля"); return; }
  const data = DB.get("konspekty", {});
  const key = `${s.toLowerCase()}|${t.toLowerCase()}`;
  data[key] = {
    label: makeLabel("📖", `${s} — ${t}`),
    enc: await enc(c),
    date: new Date().toLocaleString("ru")
  };
  DB.set("konspekty", data);
  document.getElementById("konspSubject").value = "";
  document.getElementById("konspTitle").value = "";
  document.getElementById("konspContent").value = "";
  renderKonsp();
}

function delKonsp(k) {
  const data = DB.get("konspekty", {});
  delete data[k];
  DB.set("konspekty", data);
  renderKonsp();
}

async function renderKonsp() {
  const data = DB.get("konspekty", {});
  const out = [];
  for (const k of Object.keys(data)) {
    out.push(`
      <li>
        <div class="info">
          <strong>${data[k].label || k}</strong>
          <small>${data[k].date}</small>
        </div>
        <button class="del" onclick="delKonsp('${k.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`);
  }
  document.getElementById("konspList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- Ответы ---------- */
async function addOTV() {
  const s = document.getElementById("otvSubject").value.trim();
  const t = document.getElementById("otvTopic").value.trim();
  const c = document.getElementById("otvContent").value.trim();
  if (!s || !t || !c) { alert("Заполните поля"); return; }
  const data = DB.get("otv", {});
  const key = `${s.toLowerCase()}|${t.toLowerCase()}`;
  data[key] = {
    label: makeLabel("✏️", `${s} — ${t}`),
    enc: await enc(c),
    date: new Date().toLocaleString("ru")
  };
  DB.set("otv", data);
  document.getElementById("otvSubject").value = "";
  document.getElementById("otvTopic").value = "";
  document.getElementById("otvContent").value = "";
  renderOTV();
}

function delOTV(k) {
  const data = DB.get("otv", {});
  delete data[k];
  DB.set("otv", data);
  renderOTV();
}

async function renderOTV() {
  const data = DB.get("otv", {});
  const out = [];
  for (const k of Object.keys(data)) {
    out.push(`
      <li>
        <div class="info">
          <strong>${data[k].label || k}</strong>
          <small>${data[k].date}</small>
        </div>
        <button class="del" onclick="delOTV('${k.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`);
  }
  document.getElementById("otvList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- Предметы ---------- */
function addSubject() {
  const name = document.getElementById("subjectName").value.trim();
  if (!name) return;
  const subs = DB.get("subjects", []);
  if (subs.includes(name)) { alert("Уже есть"); return; }
  subs.push(name);
  DB.set("subjects", subs);
  document.getElementById("subjectName").value = "";
  renderSubjects();
}

function delSubject(name) {
  const subs = DB.get("subjects", []).filter(s => s !== name);
  DB.set("subjects", subs);
  renderSubjects();
}

function renderSubjects() {
  const subs = DB.get("subjects", []);
  document.getElementById("subjectList").innerHTML =
    subs.map(s => `
      <li>
        <div class="info"><strong>📋 ${s}</strong></div>
        <button class="del" onclick="delSubject('${s.replace(/'/g, "\\'")}')">Удалить</button>
      </li>`).join("") || "<li>Пусто</li>";
}

/* ---------- Stepik / Яндекс / Поддержка ---------- */
async function renderStepik() {
  const data = DB.get("stepik", {});
  const out = [];
  for (const k of Object.keys(data)) {
    let val = await dec(data[k]);
    if (!val && data[k].plain) {
      val = `📧 ${data[k].plain.email}  🔑 ${data[k].plain.password}`;
    }
    out.push(`
      <li>
        <div class="info">
          <strong>💻 ${k}</strong>
          <small>${val || "🔒 ошибка расшифровки"}<br>${data[k].date || ""}</small>
        </div>
      </li>`);
  }
  document.getElementById("stepikList").innerHTML = out.join("") || "<li>Пусто</li>";
}

async function renderYandex() {
  const data = DB.get("yandex", {});
  const out = [];
  for (const k of Object.keys(data)) {
    const val = await dec(data[k]);
    out.push(`
      <li>
        <div class="info">
          <strong>🟡 ${k}</strong>
          <small>${val || "🔒 ошибка расшифровки"}<br>${data[k].date || ""}</small>
        </div>
      </li>`);
  }
  document.getElementById("yandexList").innerHTML = out.join("") || "<li>Пусто</li>";
}

async function renderSupport() {
  const data = DB.get("support", []);
  const out = [];
  for (const item of data) {
    let val = item.text;
    if (item.enc) val = await dec({ enc: item.enc });
    out.push(`
      <li>
        <div class="info">
          <strong>${item.label || "💬 Сообщение"}</strong>
          <small>${val || "🔒 ошибка"}<br>${item.date}</small>
        </div>
      </li>`);
  }
  document.getElementById("supportList").innerHTML = out.join("") || "<li>Пусто</li>";
}

/* ---------- Инициализация после ввода пароля ---------- */
async function bootAdmin() {
  ADMIN_PASSWORD = window.__ADMIN_PASSWORD__;
  await renderVPN();
  await renderOlymp();
  await renderDZ();
  await renderKonsp();
  await renderOTV();
  renderSubjects();
  await renderStepik();
  await renderYandex();
  await renderSupport();
}

document.addEventListener("admin-auth-ready", bootAdmin);
