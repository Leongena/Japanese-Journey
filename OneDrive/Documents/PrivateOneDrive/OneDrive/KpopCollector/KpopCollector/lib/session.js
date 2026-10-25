import crypto from "node:crypto";

// Clé de signature des cookies de session. Doit faire au moins 32 caractères.
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum)");
  return s;
}

// Crée un jeton signé (HMAC-SHA256) contenant des données et une date d'expiration.
export function signToken(data, ttlMs) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

// Vérifie la signature et l'expiration. Renvoie les données, ou null.
export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (data.exp < Date.now()) return null;
  return data;
}

export function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

// Ajoute plusieurs cookies d'un coup (un seul appel à setHeader peut contenir plusieurs entrées).
export function setCookies(res, list) {
  const prev = res.getHeader("Set-Cookie");
  const all = prev ? [].concat(prev, list) : list;
  res.setHeader("Set-Cookie", all);
}
