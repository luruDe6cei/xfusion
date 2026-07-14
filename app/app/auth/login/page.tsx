'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/mock-auth';

/**
 * SIMULATED login. Route matches upstream (/auth/login).
 *
 * There is no password check and no server round-trip — any input signs you in.
 * The point is to make the logged-in UI reachable, not to authenticate anyone.
 * See lib/mock-auth.ts. Real auth is roadmap #1 in HANDOFF.md.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alon@xfusion.pro');
  const [name, setName] = useState('Alon Erza');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ name: name.trim() || 'Alon Erza', email: email.trim() });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex justify-center py-[var(--spacing-80)]">
      <form
        onSubmit={submit}
        className="w-full max-w-[420px] flex flex-col gap-[var(--spacing-20)] p-[var(--spacing-32)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]"
      >
        <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)]">
          Log in
        </h1>

        <div
          className="p-[var(--spacing-12)] rounded-[var(--radius-4)] text-[length:var(--font-size-14)] leading-[var(--line-height-140)]"
          style={{ background: 'var(--gradient-warning-card)' }}
        >
          <strong>Simulated login.</strong> No password is checked and nothing is sent to
          a server — this only flips the UI into its logged-in state so the header,
          avatar menu, and gated views can be worked on.
        </div>

        <label className="flex flex-col gap-[var(--spacing-6)]">
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]"
          />
        </label>

        <label className="flex flex-col gap-[var(--spacing-6)]">
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]"
          />
        </label>

        <label className="flex flex-col gap-[var(--spacing-6)]">
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
            Password <span className="text-[color:var(--color-grey-4)]">(ignored)</span>
          </span>
          <input
            type="password"
            placeholder="anything"
            className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]"
          />
        </label>

        <button type="submit" className="btn btn-dark w-full justify-center">
          Log in
        </button>

        <Link href="/" className="text-center text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:text-[color:var(--color-primary)]">
          Back to site
        </Link>
      </form>
    </div>
  );
}
