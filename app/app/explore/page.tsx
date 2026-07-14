import Link from 'next/link';
import { getChallenges, getSolutions } from '@/lib/data';
import { ChallengeCard, SolutionCard } from '../components';
import { HeroBanner } from '../list-chrome';

/**
 * Explore — the real page (scraper/snapshot/auth-shots/explore.png): multi-colour
 * banner, then a white panel per section (Challenges, Solutions) showing a couple
 * of cards, a "View All →" link, and the same CTA card the list pages use.
 */
export default async function ExplorePage() {
  const challenges = (await getChallenges()).slice(0, 2);
  const solutions = (await getSolutions()).slice(0, 2);

  return (
    <>
      <HeroBanner title="Explore" variant="explore" />

      <ExploreSection title="Challenges" href="/challenges">
        {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
        <CTA
          heading="Do you have a complex challenge?"
          label="Add your Challenge"
          accent="var(--color-orange-1)"
          gradient="var(--gradient-warning-card)"
        />
      </ExploreSection>

      <ExploreSection title="Solutions" href="/solutions">
        {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
        <CTA
          heading="Do you have a solution to share?"
          label="Add your Solution"
          accent="var(--color-green-1)"
          gradient="var(--gradient-success-card)"
        />
      </ExploreSection>
    </>
  );
}

function ExploreSection({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="list-panel">
      <div className="flex items-center justify-between mb-[var(--spacing-20)]">
        <div className="flex items-center gap-[var(--spacing-10)]">
          <ResultsIcon />
          <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)]">{title}</h2>
        </div>
        <Link href={href} className="flex items-center gap-[6px] text-[length:var(--font-size-14)] text-[var(--color-grey-5)] hover:text-[var(--color-primary)]">
          View All →
        </Link>
      </div>
      <div className="grid-3">{children}</div>
    </div>
  );
}

function CTA({ heading, label, accent, gradient }: { heading: string; label: string; accent: string; gradient: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-[var(--spacing-20)] p-[var(--spacing-24)] rounded-[var(--radius-8)] border border-solid text-center min-h-[280px]"
      style={{ background: gradient, borderColor: accent }}
    >
      <h3 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)] leading-[var(--line-height-130)]">
        {heading}
      </h3>
      <Link href="/auth/login" className="btn btn-outline">
        {label} <span aria-hidden="true">＋</span>
      </Link>
    </div>
  );
}

function ResultsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
