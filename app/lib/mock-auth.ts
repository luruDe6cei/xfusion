'use client';

/**
 * MOCK AUTH — a simulation, NOT security.
 *
 * The real product's auth is server-side (see /api/auth/me in the captured traffic)
 * and we never had access to it. This exists so the logged-in UI is reachable:
 * a plain cookie holding a display name, read on the client.
 *
 * Deliberate choices:
 *  - NOT httpOnly, and never verified — any visitor can forge it. That's fine for a
 *    local clone; it would be a critical hole in anything real.
 *  - Client-side, so every page stays statically prerendered. Reading cookies in the
 *    root layout would force all 218 routes to render dynamically.
 *
 * When real auth lands (HANDOFF.md, roadmap #1), delete this file — don't build on it.
 */

export const COOKIE = 'xf_mock_user';

export type MockUser = { name: string; email: string };

export function readUser(): MockUser | null {
  if (typeof document === 'undefined') return null;
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
  if (!hit) return null;
  try {
    return JSON.parse(decodeURIComponent(hit.slice(COOKIE.length + 1)));
  } catch {
    return null;
  }
}

export function signIn(user: MockUser) {
  const val = encodeURIComponent(JSON.stringify(user));
  // 7 days, matching nothing in particular — it's a stub.
  document.cookie = `${COOKIE}=${val}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function signOut() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 1)
    .join('')
    .toUpperCase();
