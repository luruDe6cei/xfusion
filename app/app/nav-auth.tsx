'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readUser, signOut, initials, type MockUser } from '@/lib/mock-auth';

/**
 * The right-hand side of the header. Logged out: Log in / Sign up (upstream fills
 * "Log in" black and outlines "Sign up"). Logged in: apps-grid / chat / bell icons,
 * then an avatar + name menu.
 *
 * Icons are inline SVG approximations — upstream uses a proprietary icon font we
 * deliberately don't vendor.
 */

const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

// apps-grid, chat bubble, bell
const APPS = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z';
const CHAT = 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4.2-1L3 20l1.1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z';
const BELL = 'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0';

export function NavAuth() {
  const router = useRouter();
  const [user, setUser] = useState<MockUser | null>(null);
  const [open, setOpen] = useState(false);
  // Read after mount: the server can't see document.cookie, and rendering the
  // logged-in state on the server would hydrate-mismatch.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readUser());
    setReady(true);
  }, []);

  if (!ready) {
    // Reserve the space so the header doesn't jump on hydration.
    return <div style={{ width: 168, height: 40 }} />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-[10px]">
        <Link href="/auth/login" className="btn btn-dark btn-sm">Log in</Link>
        <Link href="/auth/login?mode=signup" className="btn btn-outline btn-sm">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[20px]">
      <div className="flex items-center gap-[18px] text-[color:var(--color-grey-black)]">
        <Link href="/dashboard" aria-label="Apps" className="hover:text-[color:var(--color-primary)]"><Icon d={APPS} /></Link>
        <Link href="/dashboard/mailbox/chat/create-new" aria-label="Messages" className="hover:text-[color:var(--color-primary)]"><Icon d={CHAT} /></Link>
        <Link href="/dashboard" aria-label="Notifications" className="hover:text-[color:var(--color-primary)]"><Icon d={BELL} /></Link>
      </div>

      <div className="h-[28px] w-px bg-[var(--color-grey-3)]" />

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-[10px]"
        >
          <span className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[var(--color-grey-2)] text-[length:var(--font-size-14)] font-[var(--font-weight-medium)]">
            {initials(user.name)}
          </span>
          <span className="text-[length:var(--font-size-16)]">{user.name}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-[46px] min-w-[180px] p-[8px] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)] shadow-[var(--shadow-card)] z-50">
            <div className="px-[12px] py-[8px] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] truncate">
              {user.email}
            </div>
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="block px-[12px] py-[8px] rounded-[var(--radius-4)] text-[length:var(--font-size-16)] hover:bg-[var(--color-grey-2)]">
              My Profile
            </Link>
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="block px-[12px] py-[8px] rounded-[var(--radius-4)] text-[length:var(--font-size-16)] hover:bg-[var(--color-grey-2)]">
              My Company
            </Link>
            <button
              onClick={() => {
                signOut();
                setUser(null);
                setOpen(false);
                router.refresh();
              }}
              className="w-full text-left px-[12px] py-[8px] rounded-[var(--radius-4)] text-[length:var(--font-size-16)] hover:bg-[var(--color-grey-2)]"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
