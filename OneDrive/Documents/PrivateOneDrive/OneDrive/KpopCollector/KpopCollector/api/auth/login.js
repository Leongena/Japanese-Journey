import crypto from "node:crypto";
import { setCookies } from "../../lib/session.js";

// Redirige vers la page d'autorisation Discord.
// Le paramètre state protège contre les attaques CSRF : il est vérifié au retour.
export default function handler(req, res) {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state
  });
  setCookies(res, [`oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`]);
  res.statusCode = 302;
  res.setHeader("Location", `https://discord.com/oauth2/authorize?${params}`);
  res.end();
}
