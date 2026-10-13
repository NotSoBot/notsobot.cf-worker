# notsobot.cf-worker
NotSoBot's Cloudflare Worker for `cdn.notsobot.com`: serves files from the storage bucket.

It also catches every other `*.notsobot.com` subdomain and answers with a JSON 404, except:
- `notsobot.com`, `www.` and `beta.`: notsobot.com-frontend's worker (its routes are more specific, so they win)
- `notsobot.com/api/*`: the apex isn't matched by `*.notsobot.com/*`, so the API stays on the origin
- `oasis.notsobot.com` (umami): has its own `oasis.notsobot.com/*` route with no worker, set in the Cloudflare
  dashboard, so it goes straight to the origin

A new origin subdomain needs its own worker-less route in the dashboard like oasis, or it will 404.

```bash
npm install
npx wrangler login   # once
npm run dev          # local
npm run deploy
```

Config (routes, `STORAGE_URL`) is in `wrangler.jsonc`. The wildcard route only sees names that resolve, so
subdomains without their own DNS record need a proxied `*` record to get the 404 instead of a DNS error.
