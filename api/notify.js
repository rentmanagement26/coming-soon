import nodemailer from 'nodemailer';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const { email, token, company } = body;

  // Honeypot: a real visitor never fills this field. Pretend success so a
  // bot doesn't learn its submission was rejected.
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  }

  if (typeof token !== 'string' || !token) {
    return res.status(400).json({ ok: false, error: 'Please complete the verification above.' });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured yet.' });
  }

  let verifyData;
  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: req.headers['x-forwarded-for'] || '',
      }),
    });
    verifyData = await verifyRes.json();
  } catch (err) {
    console.error('Turnstile verification request failed', err);
    return res.status(502).json({ ok: false, error: 'Verification service is unavailable. Please try again.' });
  }

  if (!verifyData.success) {
    return res.status(400).json({ ok: false, error: 'Verification failed. Please try again.' });
  }

  const gmailUser = process.env.GMAIL_USER || 'rentmanagement26@gmail.com';
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const notifyTo = process.env.NOTIFY_TO_EMAIL || gmailUser;

  if (!gmailAppPassword) {
    console.warn('GMAIL_APP_PASSWORD is not set — signup verified but no email was sent:', email);
    return res.status(200).json({ ok: true });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `DomusPRO Waitlist <${gmailUser}>`,
      to: notifyTo,
      subject: 'New DomusPRO waitlist signup',
      text: `${email} just joined the DomusPRO waitlist.`,
    });
  } catch (err) {
    console.error('Failed to send notification email via Gmail', err);
    return res.status(502).json({ ok: false, error: 'Could not send the notification email. Please try again shortly.' });
  }

  return res.status(200).json({ ok: true });
}
