import { readCookie, signToken, setCookies } from "../../lib/session.js";

const WEEK_MS = 7 * 24 * 3600 * 1000;

function send(res, code, msg) {
  res.statusCode = code;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(msg);
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // 1. Vérification du state (protection CSRF)
  if (!code || !state || state !== readCookie(req, "oauth_state")) {
    return send(res, 400, "Requête invalide. Réessaie depuis /api/auth/login.");
  }

  // 2. Échange du code contre un jeton d'accès utilisateur
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI
    })
  });
  if (!tokenRes.ok) return send(res, 502, "Connexion Discord échouée.");
  const { access_token } = await tokenRes.json();

  // 3. Identité de l'utilisateur
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!meRes.ok) return send(res, 502, "Impossible de lire ton profil Discord.");
  const me = await meRes.json();

  // 4. Vérification du rôle côté serveur, avec le token du bot.
  // Le bot doit être présent sur le serveur, sinon Discord répond 404.
  const memberRes = await fetch(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${me.id}`,
    { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
  );
  if (!memberRes.ok) return send(res, 403, "Tu n'es pas membre du serveur.");
  const member = await memberRes.json();
  if (!member.roles.includes(process.env.DISCORD_ROLE_ID)) {
    return send(res, 403, "Accès réservé aux membres avec le rôle hotspot.");
  }

  // 5. Session signée, valable une semaine
  const session = signToken({ uid: me.id, name: me.username }, WEEK_MS);
  setCookies(res, [
    `session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${WEEK_MS / 1000}`,
    "oauth_state=; Path=/; Max-Age=0"
  ]);
  res.statusCode = 302;
  res.setHeader("Location", "/site");
  res.end();
}
