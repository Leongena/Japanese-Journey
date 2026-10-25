import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCookie, verifyToken } from "../lib/session.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Ne renvoie la page privée qu'aux comptes dont la session est valide.
export default function handler(req, res) {
  const session = verifyToken(readCookie(req, "session"));
  res.setHeader("Cache-Control", "private, no-store");

  if (!session) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`<p>Accès réservé. <a href="/api/auth/login">Se connecter avec Discord</a></p>`);
  }

  const html = fs.readFileSync(path.join(here, "..", "private", "index.html"), "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}
