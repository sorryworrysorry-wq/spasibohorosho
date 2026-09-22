/* crypto.js — AES-GCM шифрование данных через Web Crypto API.
   Ключ выводится из пароля админа через PBKDF2.
   Без пароля расшифровать данные невозможно. */

const CryptoBox = (function () {
  const SALT_KEY = "crypto_salt";
  const KEY_CACHE = { key: null, pass: null };
  const ITERATIONS = 150000;

  function bytesToB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function getSalt() {
    let salt = localStorage.getItem(SALT_KEY);
    if (!salt) {
      const s = crypto.getRandomValues(new Uint8Array(16));
      salt = bytesToB64(s);
      localStorage.setItem(SALT_KEY, salt);
    }
    return b64ToBytes(salt);
  }

  async function deriveKey(password) {
    if (KEY_CACHE.key && KEY_CACHE.pass === password) return KEY_CACHE.key;

    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: getSalt(),
        iterations: ITERATIONS,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    KEY_CACHE.key = key;
    KEY_CACHE.pass = password;
    return key;
  }

  async function encrypt(plaintext, password) {
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plaintext)
    );
    return {
      iv: bytesToB64(iv),
      data: bytesToB64(ciphertext),
      v: 1
    };
  }

  async function decrypt(payload, password) {
    if (!payload || !payload.iv || !payload.data) return null;
    const key = await deriveKey(password);
    try {
      const iv = b64ToBytes(payload.iv);
      const data = b64ToBytes(payload.data);
      const plainBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );
      return new TextDecoder().decode(plainBuf);
    } catch {
      return null; // неверный пароль или повреждено
    }
  }

  function clearKey() {
    KEY_CACHE.key = null;
    KEY_CACHE.pass = null;
  }

  return { encrypt, decrypt, clearKey };
})();
