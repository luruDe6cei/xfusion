'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Detail-page sidebar actions, matching the real site exactly (traced by clicking
 * each button on xfusion.pro while logged in):
 *
 *   Submit Proposal  — --gradient-primary pill, white text, chevron
 *                      → /dashboard/offers/new/<slug>          (challenges only)
 *   Request details  — white pill, black text, chat icon
 *                      → /dashboard/mailbox/chat/create-new?slug=<slug>&type=<kind>
 *   Share            — black pill, white text, send icon → copy-link modal
 *
 * The offers/mailbox destinations are auth-gated app pages; ours are stubs until
 * that part of the app is built (see HANDOFF.md roadmap).
 */

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4.2-1L3 20l1.1-4.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
  </svg>
);
const SendIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const pill =
  'w-full h-[48px] px-[var(--spacing-24)] flex items-center justify-between rounded-[var(--radius-40)] text-[length:var(--font-size-16)] transition-opacity hover:opacity-90';

export function DetailActions({ slug, kind }: { slug: string; kind: 'challenge' | 'solution' }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-12)]">
      {kind === 'challenge' && (
        <Link href={`/dashboard/offers/new/${slug}`} className={pill} style={{ background: 'var(--gradient-primary)', color: 'var(--color-grey-white)' }}>
          Submit Proposal <Chevron />
        </Link>
      )}
      <Link
        href={`/dashboard/mailbox/chat/create-new?slug=${slug}&type=${kind}`}
        className={`${pill} border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)] text-[var(--color-grey-black)]`}
      >
        Request details <ChatIcon />
      </Link>
      <button onClick={share} className={pill} style={{ background: 'var(--color-grey-black)', color: 'var(--color-grey-white)' }}>
        {copied ? 'Link copied ✓' : 'Share'} <SendIcon />
      </button>
    </div>
  );
}
