import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChallenge, getChallenges } from '@/lib/data';

/**
 * "Submit a Proposal" intro — the page behind a challenge's Submit Proposal button
 * (captured: scraper/snapshot/auth-shots/action-_dashboard_offers_new_*.png).
 * Split layout: blue paint-splash intro left, tip cards right (each tinted with a
 * --gradient-*-card token and a solid colour bar).
 *
 * The "Let's start" wizard itself is a multi-step WRITE flow (drafts, AI keyword
 * suggestions, attachments) — not built; needs real auth + write paths (HANDOFF.md).
 */

export async function generateStaticParams() {
  return (await getChallenges()).map((c) => ({ slug: c.slug }));
}

const TIPS = [
  ['Keep it concise', "Whenever you see the ✨ icon, that's where xFUSION AI helps you turn your idea into a clear, well-structured solution.", 'var(--color-orange-1)', 'var(--gradient-warning-card)'],
  ['Drafts', 'You can save drafts and get back to your proposal whenever you want.', 'var(--color-green-1)', 'var(--gradient-success-card)'],
  ['Keywords', 'Start with one relevant keyword - xFUSION AI will suggest more once your description is complete.', 'var(--color-pink-1)', 'var(--gradient-error-card)'],
  ['Edit', "You'll be able to edit your proposal at any point.", 'var(--color-violet-upload)', 'var(--gradient-info-card)'],
  ['Attachments', 'You can upload relevant documents to support your proposal.', 'var(--color-violet-4)', 'var(--gradient-matched-card)'],
] as const;

export default async function SubmitProposalIntro({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) notFound();

  return (
    <div className="grid gap-[var(--spacing-40)] lg:grid-cols-2 items-start py-[var(--spacing-40)]">
      {/* Intro — upstream uses a blue paint-splash photo; approximated with gradients. */}
      <div
        className="rounded-[var(--radius-12)] p-[var(--spacing-48)] min-h-[520px] flex flex-col justify-center gap-[var(--spacing-20)]"
        style={{
          background:
            'radial-gradient(ellipse at 85% 20%, #4a5fd955 0%, transparent 50%), radial-gradient(ellipse at 90% 75%, #3b4ec788 0%, transparent 55%), linear-gradient(115deg, var(--color-grey-white) 45%, #dfe4fb 100%)',
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--color-violet-5)" strokeWidth="1.4" aria-hidden="true">
          <path d="M10 3h4a1 1 0 0 1 1 1v2h3a1 1 0 0 1 1 1v3h-2a2 2 0 1 0 0 4h2v3a1 1 0 0 1-1 1h-3v-2a2 2 0 1 0-4 0v2H8a1 1 0 0 1-1-1v-3H5a2 2 0 1 1 0-4h2V7a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1z" />
        </svg>
        <h1 className="text-[length:var(--font-size-44)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)]">
          Submit a<br />
          <span className="text-[var(--color-primary)]">Proposal</span>
        </h1>
        <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] max-w-[420px]">
          We&apos;ll take you through a few short steps to submit your proposal. To get the best
          matching score, describe your solution accurately and explain how it matches the
          specific challenge.
        </p>
        {/* The wizard is a write flow that isn't built yet — this returns to the challenge. */}
        <Link
          href={`/challenges/${c.slug}`}
          className="w-fit h-[52px] px-[var(--spacing-32)] flex items-center gap-[var(--spacing-12)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[var(--color-grey-white)] text-[length:var(--font-size-16)] hover:opacity-90 transition-opacity"
          title="The proposal wizard isn't built yet"
        >
          Let&apos;s start
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
        </Link>
        <label className="flex items-center gap-[var(--spacing-8)] text-[length:var(--font-size-14)] text-[var(--color-grey-5)]">
          <input type="checkbox" disabled /> Don&apos;t show me again
        </label>
      </div>

      {/* Tip cards */}
      <div className="grid gap-[var(--spacing-20)] sm:grid-cols-2">
        {TIPS.map(([title, body, bar, tint]) => (
          <div key={title} className="flex rounded-[var(--radius-4)] overflow-hidden" style={{ background: tint }}>
            <span className="w-[6px] shrink-0" style={{ background: bar }} />
            <div className="p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-10)] min-h-[190px]">
              <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)]">{title}</h3>
              <p className="text-[length:var(--font-size-14)] leading-[var(--line-height-140)] text-[var(--color-grey-5)]">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
