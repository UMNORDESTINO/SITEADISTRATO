# 4utoWolves token site

Static page where a user watches a Monetag ad and gets a free license token
for the extension. No build step, no dependencies — just 3 files
(`index.html`, `style.css`, `script.js`) plus `privacy.html`.

## Publish it (GitHub Pages)

1. Create a new **public** GitHub repository (e.g. `4autowolves-token`).
2. Upload the 4 files in this folder to the repo root (same "Add file" flow
   you used for `updates.json`).
3. In the repo, go to **Settings -> Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**,
   branch `main`, folder `/ (root)` -> Save.
5. GitHub gives you a URL like:
   ```
   https://<your-username>.github.io/4autowolves-token/
   ```
   That's the site URL to submit to Monetag when creating your account/zone.

## Wiring it up once you have the pieces

Edit `script.js`:
- `LICENSE_SERVER_URL` -> the Cloudflare Worker URL from `license-server/`.
- `MONETAG_ZONE_URL` -> the Direct/Smart Link URL Monetag gives you for your zone.
- `MONETAG_CLICK_ID_PARAM` -> only change this if Monetag's docs call their
  click-id macro something other than a query param you can set yourself
  (check their dashboard once you're in — this is the one piece I can't
  confirm without seeing your actual account).

In Monetag's zone postback settings, set the postback URL to:
```
https://<your-worker>.workers.dev/monetag/postback?key=<POSTBACK_SECRET>&ymid={<macro Monetag uses for your click id>}
```

Until both URLs are filled in, the page still works end to end except the
actual ad step: clicking the button creates a session and starts polling
(useful to test the license server on its own), and shows a "not configured
yet" message instead of redirecting to an ad.
