/**
 * Safety guard for admin account deletion. Returns a human-readable reason the
 * delete must be refused, or null when it's allowed. Pure so the rules are
 * unit-tested independently of Supabase. Deleting an account is irreversible
 * (removes the auth user + their listings), so the rules are deliberately strict:
 * never a missing account, never yourself, never another admin.
 */
export function accountDeleteError(
  actorId: string,
  target: { id: string; role: string } | null,
): string | null {
  if (!target) return "That account no longer exists.";
  if (target.id === actorId) return "You can't delete your own account.";
  if (target.role === "admin") return "Admin accounts can't be deleted here.";
  return null;
}
