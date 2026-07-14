import { getIndustries } from '@/lib/data';
import { IntakeChat } from './intake-chat';

// xFUSION 2.0 (spec ch. 2) — "Step 1: Conversation Instead of Forms".
// Instead of opening dozens of fields, a single chat window opens; the AI asks
// 3–4 guiding questions, drafts every field, and the user only confirms.

export const metadata = { title: 'Submit a Challenge — xFUSION' };

export default async function NewChallengePage() {
  const industries = await getIndustries();
  return (
    <div className="py-[var(--spacing-40)] max-w-[840px] mx-auto flex flex-col gap-[var(--spacing-24)]">
      <header className="flex flex-col gap-[var(--spacing-8)]">
        <div className="flex items-center gap-[var(--spacing-12)] flex-wrap">
          <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
            Submit a Challenge
          </h1>
          <span
            className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)]"
            style={{ background: 'var(--gradient-ai)' }}
          >
            2.0 preview — AI intake
          </span>
        </div>
        <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] text-[color:var(--color-grey-5)]">
          No forms. Describe your pain point in your own words — the AI asks a few guiding
          questions, then drafts the whole challenge for you to review and publish.
        </p>
      </header>
      <IntakeChat industries={industries.map((i) => i.name)} />
    </div>
  );
}
