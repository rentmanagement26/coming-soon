# DomusPRO — Coming Soon

Static landing page with a real waitlist signup, meant to be deployed on Vercel.
`index.html` is the page; `api/notify.js` is a Vercel serverless function that
verifies a Cloudflare Turnstile captcha and (optionally) emails a notification
via Resend when someone signs up. No database — signups aren't stored anywhere,
just relayed to your inbox.

## 1. Get a Turnstile site + secret key

1. Go to the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) and add a site.
2. Widget mode: "Managed" is a good default (shows a checkbox only when it's unsure).
3. Copy the **Site Key** and paste it into `index.html`, replacing `YOUR_TURNSTILE_SITE_KEY`
   in the `data-sitekey="..."` attribute. The site key is public — safe to commit.
4. Copy the **Secret Key** — that one is private, goes into the `TURNSTILE_SECRET_KEY`
   environment variable on Vercel (never commit it).

## 2. (Optional) Get a Resend API key

If you want an actual email sent to you on each signup:

1. Create a free account at [resend.com](https://resend.com) and grab an API key.
2. Set `RESEND_API_KEY` as an environment variable on Vercel.
3. For quick testing you can leave `NOTIFY_FROM_EMAIL` as the default
   `onboarding@resend.dev` sender — no domain verification needed. To send
   from your own domain later, verify it in Resend and update the env var.

If you skip this step, signups still get captcha-verified and accepted —
you just won't get an email; check the Vercel function logs instead.

## 3. Set environment variables on Vercel

In the Vercel project settings → Environment Variables, add:

| Name                 | Required | Notes                                              |
|----------------------|----------|-----------------------------------------------------|
| `TURNSTILE_SECRET_KEY` | Yes    | From step 1.                                        |
| `RESEND_API_KEY`      | No       | From step 2. Omit to skip sending email.            |
| `NOTIFY_TO_EMAIL`     | No       | Defaults to `rentmanagement26@gmail.com`.           |
| `NOTIFY_FROM_EMAIL`   | No       | Defaults to the shared Resend testing address.      |

(`.env.example` lists the same variables — copy it to `.env` for local dev
with `vercel dev`, but never commit the real `.env`.)

## 4. Deploy

```bash
npm install -g vercel   # if you don't have it
vercel                  # first deploy, follow the prompts
vercel --prod            # promote to production
```

Vercel auto-detects this as a static site with serverless functions — no
framework, no build step needed.

## Notes

- The email address in the footer is assembled from data attributes at
  runtime rather than printed as plain text, to make it slightly harder for
  basic scrapers to harvest.
- Spam defenses on the signup form: a honeypot field, a minimum-time-before-submit
  check, client- and server-side email format validation, and the Turnstile
  captcha itself. There's no persistent rate-limiting (e.g. per-IP) — add
  something like Upstash Redis in `api/notify.js` if that becomes necessary.
