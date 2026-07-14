import { getChallenge, getSolution } from '@/lib/data';

/**
 * Mailbox "New message" composer — the page behind Request details
 * (captured: scraper/snapshot/auth-shots/action-_dashboard_mailbox_chat_create-new_*.png).
 * Two panes: conversation list (empty state) left, composer right with the
 * challenge/solution name prefilled from ?slug=&type=.
 *
 * Sending needs real auth + a message store — not built (HANDOFF.md roadmap).
 * Reading searchParams makes this route dynamic; that matches upstream, where
 * it's a per-user app page.
 */

const MailIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
);

export default async function CreateNewMessage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; type?: string }>;
}) {
  const { slug, type } = await searchParams;
  const item =
    type === 'solution' ? await getSolution(slug ?? '') : await getChallenge(slug ?? '');
  const label = type === 'solution' ? 'Solution Name' : 'Challenge Name';

  return (
    <div className="full-bleed grid lg:grid-cols-[420px_1fr] min-h-[calc(100vh-64px)] bg-[var(--color-grey-white)]">
      {/* Conversation list — empty state, as a fresh account sees it. */}
      <aside className="border-r border-solid border-[var(--color-grey-2)] p-[var(--spacing-24)] flex flex-col">
        <input
          placeholder="Search"
          disabled
          className="h-[44px] px-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-border-input)] text-[length:var(--font-size-16)]"
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-[var(--spacing-12)] text-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-1)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.5 4.5 2.5 11l7 3.5L13 21l8.5-16.5z" />
            <path d="M9.5 14.5 21.5 4.5" strokeDasharray="2 2" />
          </svg>
          <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)]">No conversations yet</h3>
          <p className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)] max-w-[260px]">
            Your conversations will appear here when you start messaging with other users
          </p>
        </div>
      </aside>

      {/* Composer */}
      <section className="p-[var(--spacing-32)] flex flex-col gap-[var(--spacing-20)]">
        <div className="flex items-center gap-[var(--spacing-12)] pb-[var(--spacing-16)] border-b border-solid border-[var(--color-grey-2)]">
          <MailIcon />
          <h1 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)]">New message</h1>
        </div>

        <div className="flex flex-col gap-[var(--spacing-6)]">
          <span className="text-[length:var(--font-size-14)]">{label}</span>
          <input
            value={item?.name ?? slug ?? ''}
            disabled
            className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] bg-[var(--color-grey-1)] border border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-16)] text-[var(--color-grey-5)]"
          />
        </div>

        <div className="flex-1 flex flex-col rounded-[var(--radius-8)] border border-solid border-[var(--color-border-input)] overflow-hidden">
          {/* Formatting toolbar — visual only; messaging isn't built. */}
          <div className="flex items-center gap-[var(--spacing-16)] px-[var(--spacing-16)] h-[52px] border-b border-solid border-[var(--color-grey-2)] text-[var(--color-grey-black)]">
            <strong className="text-[17px]">B</strong>
            <em className="text-[17px] font-serif">I</em>
            <span className="underline text-[16px]">U</span>
            <span className="text-[var(--color-grey-4)]">|</span>
            <span className="text-[15px]">≡</span>
            <span className="text-[15px]">⋮≡</span>
          </div>
          <textarea
            disabled
            placeholder="Messaging isn't built in this clone yet — see HANDOFF.md roadmap."
            className="flex-1 min-h-[220px] p-[var(--spacing-16)] text-[length:var(--font-size-16)] resize-none bg-[var(--color-grey-white)]"
          />
        </div>

        <div className="flex items-center justify-between pt-[var(--spacing-8)] border-t border-solid border-[var(--color-grey-2)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-grey-5)" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10.5 17.5a2 2 0 0 1-3-3L16 6" />
          </svg>
          <button disabled className="flex items-center gap-[var(--spacing-10)] text-[length:var(--font-size-16)] text-[var(--color-grey-5)] cursor-not-allowed">
            Send
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </div>
      </section>
    </div>
  );
}
