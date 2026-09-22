/* script.js — публичная часть (чат). Читает данные из localStorage,
   пытаясь расшифровать их тем же паролем, что введён в админке.
   Если пароль неизвестен (обычный пользователь), показываем только
   публичные метаданные (названия), без содержимого. */

const DB = {
  get(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch { return def; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

const DEFAULT_SUBJECTS = ["Алгебра","Геометрия","Русский язык","Литература",
  "История","Обществознание","Физика","Химия","Биология","География",
  "Английский язык","Информатика"];

if (!DB.get("subjects", null)) DB.set("subjects", DEFAULT_SUBJECTS);

/* ================== Математика ================== */

function parseSide(side) {
  side = side.replace(/\s/g, "");
  if (side && !"+-".includes(side[0])) side = "+" + side;
  const terms = side.match(/[+-][^+-]+/g) || [];
  let a = 0, b = 0;
  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1;
    const body = term.slice(1);
    if (!body) continue;
    if (/[a-zA-Zа-яА-Я]/.test(body)) {
      const nums = body.replace(/[a-zA-Zа-яА-Я]/g, "");
      if (nums === "" || nums === "+") a += sign * 1;
      else if (nums === "-") a += sign * -1;
      else a += sign * parseFloat(nums);
    } else {
      b += sign * parseFloat(body);
    }
  }
  return [a, b];
}

function fmt(n) {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function solveEquation(eq) {
  eq = eq.replace(/\s/g, "");
  if (!eq.includes("=")) return "❌ Нет знака '='!";
  const [left, right] = eq.split("=", 2);
  const [a1, b1] = parseSide(left);
  const [a2, b2] = parseSide(right);
  const A = a1 - a2, B = b1 - b2;

  let out = `📝 Уравнение: ${left} = ${right}\n\n`;
  out += `Шаг 1. Переносим всё в левую часть:\n`;
  let lp = [];
  if (a1) lp.push(`${fmt(a1)}x`);
  if (b1) lp.push(fmt(b1));
  let rp = [];
  if (a2) rp.push(`${a2 > 0 ? "-" : "+"}${fmt(Math.abs(a2))}x`);
  if (b2) rp.push(`${b2 > 0 ? "-" : "+"}${fmt(Math.abs(b2))}`);
  out += `   ${lp.join(" ") || "0"} ${rp.join(" ")} = 0\n\n`;
  out += `Шаг 2. Приводим подобные:\n   ${fmt(A)}x + ${fmt(B)} = 0\n\n`;
  out += `Шаг 3. Переносим число:\n   ${fmt(A)}x = ${fmt(-B)}\n\n`;
  if (A === 0) {
    out += B === 0 ? "✅ x — любое число" : "❌ Решений нет";
    return out;
  }
  const x = -B / A;
  out += `Шаг 4. Делим на коэффициент:\n   x = ${fmt(-B)} / ${fmt(A)}\n\n`;
  out += `✅ Ответ: x = ${fmt(x)}`;
  return out;
}

function solveRussian(task) {
  const tl = task.toLowerCase();
  if (tl.includes("встав") || task.includes("_")) {
    return "🔤 Вставить пропущенные буквы:\n1. Прочитай слово\n2. Определи часть слова\n3. Вспомни правило\n4. Вставь букву";
  }
  if (tl.includes("морфолог")) {
    return "🔍 Морфологический разбор:\n1. Часть речи\n2. Начальная форма\n3. Постоянные признаки\n4. Непостоянные\n5. Синтаксическая роль";
  }
  if (tl.includes("синтакс")) {
    return "📖 Синтаксический разбор:\n1. Грамматическая основа\n2. Тип предложения\n3. Второстепенные члены\n4. Схема";
  }
  return "🤔 Уточни задание (например: «вставить буквы», «морфологический разбор»)";
}

/* ================== Чат ================== */

const chatBody = document.getElementById("chatBody");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let currentState = null;
let chatPassword = null; // пароль, если пользователь его ввёл в чате

function addMsg(text, who = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function botSay(text) { addMsg(text, "bot"); }
function userSay(text) { addMsg(text, "user"); }

function showMainMenu() {
  botSay("👋 Привет! Выбери действие слева или напиши команду:\n\n" +
    "• 💻 Информатика\n" +
    "• 🧮 Решить уравнение\n" +
    "• 📚 Русский язык\n" +
    "• 📝 Олимпиады\n" +
    "• 📚 ЦДЗ\n" +
    "• 📖 Конспекты\n" +
    "• ✏️ Ответы\n" +
    "• 🔐 VPN\n" +
    "• 💬 Поддержка");
}

botSay("👋 Привет! Я бот-помощник. Напиши /start или выбери пункт меню.");

/* Показать расшифрованный список или только названия */
async function showEncryptedList(label, storageKey, fields) {
  const raw = DB.get(storageKey, {});
  const keys = Object.keys(raw);

  if (!keys.length) { botSay(`📭 Пока нет данных в разделе «${label}».`); return; }

  // Собираем «видимые» заголовки. Если данные зашифрованы — нужен пароль.
  const lines = [];
  for (const k of keys) {
    const item = raw[k];
    if (item.enc) {
      if (chatPassword) {
        const dec = await CryptoBox.decrypt(item.enc, chatPassword);
        if (dec) {
          lines.push(`🔓 ${dec}`);
          continue;
        }
      }
      // без пароля показываем только метку
      lines.push(`🔒 ${item.label || "зашифровано"}`);
    } else {
      lines.push(`• ${item[fields.title] || k}`);
    }
  }

  let header = `📂 ${label}:\n\n` + lines.join("\n");
  if (!chatPassword && keys.some(k => raw[k].enc)) {
    header += "\n\n💡 Введи /password чтобы ввести пароль и увидеть содержимое.";
  }
  botSay(header);
}

async function handleMessage(text) {
  const t = text.trim();
  const low = t.toLowerCase();

  if (currentState === "eq") {
    currentState = null;
    botSay(solveEquation(t));
    return;
  }
  if (currentState === "rus") {
    currentState = null;
    botSay(solveRussian(t));
    return;
  }
  if (currentState === "support") {
    currentState = null;
    const msgs = DB.get("support", []);
    msgs.push({ text: t, label: "💬 Сообщение в поддержку", date: new Date().toLocaleString("ru") });
    DB.set("support", msgs);
    botSay("✅ Сообщение отправлено владельцу!");
    return;
  }
  if (currentState === "password") {
    currentState = null;
    chatPassword = t;
    // проверяем — попробуем что-то расшифровать
    const dz = DB.get("dz", {});
    const test = Object.values(dz).find(v => v.enc);
    if (test) {
      const dec = await CryptoBox.decrypt(test.enc, chatPassword);
      if (!dec) { chatPassword = null; botSay("❌ Неверный пароль."); return; }
    }
    botSay("🔓 Пароль принят! Теперь показываю расшифрованные данные.");
    return;
  }
  if (currentState === "stepik") {
    currentState = null;
    if (!t.includes(":")) { botSay("❌ Формат: почта:пароль"); return; }
    const [email, pass] = t.split(":", 2);
    const data = DB.get("stepik", {});
    const label = `📧 ${email.trim()}`;
    const enc = chatPassword
      ? await CryptoBox.encrypt(`Stepik | ${email.trim()} | ${pass.trim()}`, chatPassword)
      : null;
    data[email.trim()] = {
      label,
      enc,
      plain: enc ? null : { email: email.trim(), password: pass.trim() },
      date: new Date().toLocaleString("ru")
    };
    DB.set("stepik", data);
    botSay(`✅ Данные Stepik сохранены!\n📧 ${email.trim()}${enc ? "\n🔒 Зашифровано." : ""}`);
    return;
  }

  if (low === "/start" || low === "начать" || low === "меню") { showMainMenu(); return; }
  if (low === "/help" || low === "помощь") {
    botSay("Команды:\n/start — меню\n/vpn — VPN-ключи\n/stepik — ввести данные Stepik\n/equation — решить уравнение\n/password — ввести пароль для расшифровки\n/logout — забыть пароль");
    return;
  }
  if (low === "/password") {
    currentState = "password";
    botSay("🔑 Введи пароль администратора для расшифровки данных:");
    return;
  }
  if (low === "/logout") {
    chatPassword = null;
    CryptoBox.clearKey();
    botSay("🔒 Пароль забыт. Данные снова зашифрованы.");
    return;
  }

  if (low.includes("информатика")) {
    botSay("💻 Категория: Информатика\n\nНапиши /stepik чтобы ввести данные.");
    return;
  }
  if (low.includes("уравнен") || low === "/equation") {
    currentState = "eq";
    botSay("🧮 Отправь уравнение. Пример: 2x + 3 = 7");
    return;
  }
  if (low.includes("русск")) {
    currentState = "rus";
    botSay("📚 Напиши задание по русскому языку.");
    return;
  }
  if (low.includes("олимпиад")) { await showEncryptedList("Олимпиады", "olympiads", { title: "name" }); return; }
  if (low.includes("цдз") || low.includes("дз")) { await showEncryptedList("ЦДЗ", "dz", { title: "title" }); return; }
  if (low.includes("конспект")) { await showEncryptedList("Конспекты", "konspekty", { title: "title" }); return; }
  if (low.includes("ответ")) { await showEncryptedList("Ответы", "otv", { title: "topic" }); return; }
  if (low.includes("vpn") || low === "/vpn") {
    const raw = DB.get("vpn", {});
    const keys = Object.keys(raw);
    if (!keys.length) { botSay("❌ Пока нет доступных VPN-ключей."); return; }
    const lines = [];
    for (const k of keys) {
      const item = raw[k];
      if (item.enc) {
        if (chatPassword) {
          const dec = await CryptoBox.decrypt(item.enc, chatPassword);
          if (dec) { lines.push(`📌 ${k}:\n${dec}`); continue; }
        }
        lines.push(`📌 ${k}: 🔒 зашифровано`);
      } else {
        lines.push(`📌 ${k}:\n${item.key}`);
      }
    }
    let msg = "🔐 Доступные VPN-ключи:\n\n" + lines.join("\n\n");
    if (!chatPassword && keys.some(k => raw[k].enc)) msg += "\n\n💡 /password чтобы расшифровать.";
    botSay(msg);
    return;
  }
  if (low.includes("поддержк") || low === "/support") {
    currentState = "support";
    botSay("💬 Напиши сообщение владельцу.");
    return;
  }
  if (low === "/stepik") {
    currentState = "stepik";
    botSay("📧 Введите почта:пароль от Stepik");
    return;
  }

  botSay("❓ Не понял команду. Напиши /start или выбери пункт слева.");
}

sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  userSay(text);
  input.value = "";
  setTimeout(() => handleMessage(text), 250);
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    const labels = {
      informatics: "💻 Информатика",
      equation: "🧮 Решить уравнение",
      russian: "📚 Русский язык",
      olympiads: "📝 Олимпиады",
      dz: "📚 ЦДЗ",
      konspekty: "📖 Конспекты",
      otv: "✏️ Ответы",
      vpn: "🔐 VPN",
      support: "💬 Поддержка"
    };
    userSay(labels[action]);
    setTimeout(() => handleMessage(labels[action]), 250);
  });
});
