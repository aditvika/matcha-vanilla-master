// Strict email syntax + disposable/temporary domain blocking.

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "33mail.com",
  "anonbox.net",
  "byom.de",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "inboxbear.com",
  "inboxkitten.com",
  "mail-temp.com",
  "mail7.io",
  "mailbox52.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mailsac.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "nada.email",
  "sharklasers.com",
  "spam4.me",
  "temp-mail.io",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.dev",
  "tempmail.net",
  "tempmail.plus",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

const DISPOSABLE_PATTERNS = [
  /tempm(ai)?l/i,
  /temp-?mail/i,
  /throwaway/i,
  /disposable/i,
  /trashmail/i,
  /fakemail/i,
  /minutemail/i,
  /guerrilla/i,
  /mailinator/i,
  /yopmail/i,
  /getnada/i,
  /sharklasers/i,
];

// Practical, strict RFC-ish syntax: no consecutive dots, valid TLD, no leading/trailing dots.
const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

export type EmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "format" | "disposable" };

export function validateEmail(raw: string): EmailCheck {
  const email = raw.trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, reason: "format" };
  }

  const domain = email.split("@")[1] ?? "";
  if (!domain.includes(".") || domain.endsWith(".")) {
    return { ok: false, reason: "format" };
  }
  // Reject local/test-only domains.
  if (/\.(local|test|invalid|example|localhost)$/i.test(domain)) {
    return { ok: false, reason: "format" };
  }

  const parts = domain.split(".");
  const base = parts.slice(-2).join(".");
  if (DISPOSABLE_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(base)) {
    return { ok: false, reason: "disposable" };
  }
  if (DISPOSABLE_PATTERNS.some((p) => p.test(domain))) {
    return { ok: false, reason: "disposable" };
  }

  return { ok: true, email };
}
