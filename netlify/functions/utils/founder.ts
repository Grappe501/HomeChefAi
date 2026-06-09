/** Founder access — FOUNDER_EMAILS env (comma-separated) */

export function getFounderEmails(): string[] {
  return (process.env.FOUNDER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  const founders = getFounderEmails();
  if (founders.length === 0) return false;
  return founders.includes(email.trim().toLowerCase());
}

/** Dev: allow founder access when FOUNDER_EMAILS unset (local testing) */
export function isFounderUser(user: { id: string; email?: string | null }, devMode?: boolean): boolean {
  if (isFounderEmail(user.email)) return true;
  if (devMode && getFounderEmails().length === 0) return true;
  return false;
}

export async function syncFounderFlag(
  db: { from: (t: string) => { update: (d: object) => { eq: (c: string, v: string) => Promise<{ error: unknown }> } } },
  userId: string,
  email?: string | null
): Promise<boolean> {
  const founder = isFounderEmail(email);
  await db.from('profiles').update({ is_founder: founder, updated_at: new Date().toISOString() }).eq('user_id', userId);
  return founder;
}
