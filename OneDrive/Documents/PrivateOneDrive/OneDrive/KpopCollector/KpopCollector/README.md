# KpopCollector : backend

Accès à la page privée uniquement pour les membres du serveur Discord qui ont le rôle `hotspot`.

## Structure

- `api/auth/login.js` : redirige vers Discord (OAuth2).
- `api/auth/callback.js` : échange le code, vérifie le rôle via le bot, pose le cookie de session.
- `api/site.js` : renvoie `private/index.html` si la session est valide.
- `lib/session.js` : signature et vérification des cookies (HMAC, sans dépendance).

## Mise en place

1. Copie le contenu de ce dossier dans le dépôt `KpopCollector`.
2. Crée un dossier `private/` et place-y ta page sous le nom `index.html` (la maquette de boosters).
3. Dans le portail Discord (OAuth2 → Redirects), ajoute `https://<ton-projet>.vercel.app/api/auth/callback`.
4. Sur Vercel, importe le dépôt et renseigne toutes les variables de `.env.example` (Settings → Environment Variables).
5. Génère `SESSION_SECRET` avec une commande du type `openssl rand -hex 32`.
6. Ouvre `https://<ton-projet>.vercel.app/site` : tu seras redirigé vers la connexion Discord.

## Sécurité

- Ne publie pas la maquette comme artifact public : `private/index.html` doit rester sur le serveur.
- Les secrets (client secret, token du bot, session, MongoDB) ne vont jamais dans le code ni dans le dépôt.
- Si un secret apparaît quelque part par erreur, régénère-le immédiatement dans le portail Discord.
