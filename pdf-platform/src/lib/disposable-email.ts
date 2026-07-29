import disposableDomains from "disposable-email-domains";

// ~120k known temp-mail/disposable domains (mailinator, guerrillamail,
// 10minutemail, yopmail, etc.), community-maintained. A Set for O(1)
// lookup — this runs on every sign-up, and the list is far too large for
// a linear scan to be worth it.
const DISPOSABLE_DOMAINS = new Set(disposableDomains as string[]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
