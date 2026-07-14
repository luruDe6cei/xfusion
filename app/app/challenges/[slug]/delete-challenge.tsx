'use client';

import { useState, useTransition } from 'react';
import { removeChallenge } from './actions';

// Local-demo control: the real site has no public delete. Two-step confirm so a
// stray click can't remove a challenge. Seeded rows are restorable via db:seed;
// AI-published ones are not.
export function DeleteChallenge({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-fit text-[length:var(--font-size-14)] hover:underline"
        style={{ color: 'var(--color-error)' }}
      >
        Delete Challenge (local demo)
      </button>
    );
  }

  return (
    <div className="flex items-center gap-[var(--spacing-12)] flex-wrap text-[length:var(--font-size-14)]">
      <span className="text-[color:var(--color-grey-5)]">Delete permanently?</span>
      <button
        disabled={pending}
        onClick={() => startTransition(() => removeChallenge(slug))}
        className="h-[32px] px-[var(--spacing-16)] rounded-[var(--radius-40)] text-[color:var(--color-grey-white)] disabled:opacity-60 hover:opacity-90"
        style={{ background: 'var(--color-error)' }}
      >
        {pending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="text-[color:var(--color-grey-5)] hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
