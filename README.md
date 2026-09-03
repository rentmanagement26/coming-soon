# DomusPRO — Coming Soon

Static landing page with a real waitlist signup, meant to be deployed on Vercel.
`index.html` is the page; `api/notify.js` is a Vercel serverless function that
verifies a Cloudflare Turnstile captcha and (optionally) emails a notification
via Gmail when someone signs up. No database — signups aren't stored anywhere,
just relayed to your inbox.

## 1. Get a Turnstile site + secret key

1. Go to the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) and add a site.
2. Widget mode: "Managed" is a good default (shows a checkbox only when it's unsure).
3. Add every hostname the page will actually run on (e.g. both `domuspro.ca`
   and `www.domuspro.ca` if one redirects to the other — Turnstile checks the
   exact hostname the page loads on).
4. Copy the **Site Key** and paste it into `index.html`, replacing `YOUR_TURNSTILE_SITE_KEY`
   in the `data-sitekey="..."` attribute. The site key is public — safe to commit.
5. Copy the **Secret Key** — that one is private, goes into the `TURNSTILE_SECRET_KEY`
   environment variable on Vercel (never commit it).

## 2. (Optional) Get a Gmail App Password

If you want an actual email sent to you on each signup, using the same Gmail
account you're already notifying (`rentmanagement26@gmail.com`) is the
simplest option — no third-party service needed:

1. Turn on 2-Step Verification for that Google account, if it isn't already:
   [myaccount.google.com/security](https://myaccount.google.com/security).
2. Once 2-Step Verification is on, go to
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   and create an app password (name it something like "DomusPRO Vercel").
3. Copy the 16-character password it gives you — that's `GMAIL_APP_PASSWORD`.
4. Set `GMAIL_APP_PASSWORD` as an environment variable on Vercel. `GMAIL_USER`
   defaults to `rentmanagement26@gmail.com`, so you only need to set it if
   you're sending from a different account.

If you skip this step, signups still get captcha-verified and accepted —
you just won't get an email; check the Vercel function logs instead.

## 3. Set environment variables on Vercel

In the Vercel project settings → Environment Variables, add:

| Name                  | Required | Notes                                          |
|------------------------|----------|-------------------------------------------------|
| `TURNSTILE_SECRET_KEY` | Yes      | From step 1.                                    |
| `GMAIL_APP_PASSWORD`   | No       | From step 2. Omit to skip sending email.        |
| `GMAIL_USER`           | No       | Defaults to `rentmanagement26@gmail.com`.       |
| `NOTIFY_TO_EMAIL`      | No       | Defaults to `GMAIL_USER`.                       |

(`.env.example` lists the same variables — copy it to `.env` for local dev
with `vercel dev`, but never commit the real `.env`.)

## 4. Deploy

```bash
npm install -g vercel   # if you don't have it
vercel                  # first deploy, follow the prompts
vercel --prod            # promote to production
```

Vercel auto-detects this as a static site with serverless functions — no
build step needed beyond installing `nodemailer` from `package.json`.

## Notes

- Spam defenses on the signup form: a honeypot field, a minimum-time-before-submit
  check, client- and server-side email format validation, and the Turnstile
  captcha itself. There's no persistent rate-limiting (e.g. per-IP) — add
  something like Upstash Redis in `api/notify.js` if that becomes necessary.
- There's no list of past signups anywhere — each one just triggers a single
  notification email. If you want a running list instead, look at Resend
  Audiences, a spreadsheet webhook, or a small database.
