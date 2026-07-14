import { getCompany, getCompanies, challengesByCompany, solutionsByCompany } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ChallengeCard, SolutionCard } from '../../components';
import { OrgTabs } from './org-tabs';

/**
 * Organization detail — mirrors the captured page (auth-shots/organizations_*.png):
 * multi-colour banner strip with a floating logo card on the LEFT, then
 * Overview / Challenges / Solutions tabs. Overview = white panel with the org's
 * name, description, and a black "Visit Website ↗" pill.
 */

export async function generateStaticParams() {
  return (await getCompanies())
    .filter((c) => typeof c.slug === 'string' && c.slug.length > 0)
    .map((c) => ({ slug: c.slug }));
}

export default async function OrgDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();
  const logo = c.logo?.thumbnailUrl || c.logo?.url;
  const challenges = await challengesByCompany(c.id);
  const solutions = await solutionsByCompany(c.id);

  const overview = (
    <div className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] p-[var(--spacing-32)] flex flex-col gap-[var(--spacing-16)]">
      <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)]">
        {c.name}
      </h1>
      {c.description && (
        <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] max-w-[880px]">
          {c.description}
        </p>
      )}
      {c.website && (
        <a
          href={c.website}
          target="_blank"
          rel="noreferrer"
          className="w-fit flex items-center gap-[var(--spacing-32)] h-[48px] px-[var(--spacing-24)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)] hover:opacity-90 transition-opacity"
        >
          Visit Website
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      )}
    </div>
  );

  const empty = (what: string) => (
    <div className="min-h-[240px] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] flex flex-col items-center justify-center gap-[var(--spacing-12)]">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-1)" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" strokeDasharray="3 2.4" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <p className="text-[length:var(--font-size-16)] text-[color:var(--color-grey-5)]">No {what} published yet</p>
    </div>
  );

  return (
    <>
      {/* Banner strip with the floating logo card, left-aligned like upstream. */}
      <div className="full-bleed hero-banner--explore" style={{ minHeight: 104, marginBottom: 0, position: 'relative' }}>
        <div className="container" style={{ width: '100%' }}>
          <div className="absolute top-[28px] w-[160px] h-[160px] rounded-[var(--radius-12)] bg-[var(--color-grey-white)] shadow-[var(--shadow-card)] flex items-center justify-center overflow-hidden">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={c.name} width={120} height={120} style={{ objectFit: 'contain' }} />
            ) : (
              <span className="text-[length:var(--font-size-32)] text-[color:var(--color-grey-5)]">{c.name[0]}</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ paddingTop: 110 }}>
        <OrgTabs
          tabs={[
            { label: 'Overview', content: overview },
            {
              label: 'Challenges',
              content: challenges.length ? (
                <div className="grid-3">{challenges.map((ch) => <ChallengeCard key={ch.id} c={ch} />)}</div>
              ) : empty('challenges'),
            },
            {
              label: 'Solutions',
              content: solutions.length ? (
                <div className="grid-3">{solutions.map((s) => <SolutionCard key={s.id} s={s} />)}</div>
              ) : empty('solutions'),
            },
          ]}
        />
      </div>
    </>
  );
}
