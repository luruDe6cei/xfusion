import { getChallenge, getChallenges } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DetailActions } from '../../detail-actions';

/**
 * Challenge detail — mirrors the real page's structure
 * (scraper/snapshot/html/challenges/*.html). Section mapping, derived by diffing
 * the rendered page against the API payload:
 *
 *   Background          → company.description   (the ORG's blurb, not a challenge field)
 *   Challenge           → shortDescription
 *   Challenge Objectives→ objective
 *   Incentives          → rewardInformation
 *
 * The API has no `description`/`background` field on a challenge; don't look for one.
 */

export async function generateStaticParams() {
  return (await getChallenges()).map((c) => ({ slug: c.slug }));
}

// Upstream prints "July 12th, 2026".
const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const longDate = (d: Date | string) => {
  const x = new Date(d);
  return `${x.toLocaleString('en-US', { month: 'long' })} ${ordinal(x.getDate())}, ${x.getFullYear()}`;
};

export default async function ChallengeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) notFound();

  const logo = c.company?.logo?.thumbnailUrl || c.company?.logo?.url;

  return (
    <article className="py-[var(--spacing-40)] grid gap-[var(--spacing-40)] lg:grid-cols-[1fr_320px] items-start">
      {/* Main column */}
      <div className="flex flex-col gap-[var(--spacing-32)] min-w-0">
        <header className="flex flex-col gap-[var(--spacing-16)]">
          <div className="flex items-center gap-[var(--spacing-8)] flex-wrap">
            {c.industry && (
              <span className="h-[40px] px-[var(--spacing-24)] flex items-center bg-[var(--color-violet-3)] text-[length:var(--font-size-16)] leading-[var(--line-height-130)]">
                {c.industry.name}
              </span>
            )}
            {c.subIndustry && (
              <span className="h-[40px] px-[var(--spacing-16)] flex items-center bg-[var(--color-violet-1)] text-[length:var(--font-size-16)] leading-[var(--line-height-130)]">
                {c.subIndustry.name}
              </span>
            )}
          </div>

          <h1 className="text-[length:var(--font-size-44)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
            {c.name}
          </h1>

          <Link
            href={`/organizations/${c.company?.slug}`}
            className="flex items-center gap-[var(--spacing-12)] w-fit"
          >
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={40} height={40} className="rounded-[var(--radius-4)] object-cover" />
            )}
            <span className="text-[length:var(--font-size-16)] text-[color:var(--color-grey-5)]">
              {c.company?.name}
            </span>
          </Link>
        </header>

        {/* Background = the organization's own blurb, as upstream does it. */}
        <Section title="Background" body={c.company?.description} />
        <Section title="Challenge" body={c.shortDescription} />

        {c.requiredExpertise?.length > 0 && (
          <section className="flex flex-col gap-[var(--spacing-12)]">
            <h3 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)]">
              Required Expertise
            </h3>
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {c.requiredExpertise.map((e) => <Pill key={e}>{e}</Pill>)}
            </div>
          </section>
        )}

        <Section title="Challenge Objectives" body={c.objective} />
        <Section title="Incentives" body={c.rewardInformation} />

        {c.keywords?.length > 0 && (
          <section className="flex flex-col gap-[var(--spacing-12)]">
            <h3 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)]">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {c.keywords.map((k) => <Pill key={k}>{k}</Pill>)}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar — upstream's action panel. The actions need auth + write paths,
          neither of which exists yet (see HANDOFF.md), so they're inert. */}
      <aside className="lg:sticky lg:top-[88px] w-full flex flex-col gap-[var(--spacing-16)] p-[var(--spacing-24)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]">
        <div className="flex flex-col gap-[var(--spacing-4)]">
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">Published Date</span>
          <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-medium)]">
            {longDate(c.createdAt)}
          </span>
        </div>

        <DetailActions slug={c.slug} kind="challenge" />

        <dl className="grid grid-cols-2 gap-[var(--spacing-12)] pt-[var(--spacing-16)] border-t border-solid border-[var(--color-grey-2)]">
          <Meta label="Match score" value={c.averageMatchScore ? `${Math.round(c.averageMatchScore)}%` : '—'} />
          <Meta label="Views" value={String(c.viewsCount)} />
          <Meta
            label="Deployment"
            value={c.requiredDeploymentTime ? c.requiredDeploymentTime.replaceAll('_', ' ').toLowerCase() : '—'}
          />
        </dl>
      </aside>
    </article>
  );
}

function Section({ title, body }: { title: string; body?: string | null }) {
  if (!body) return null;
  return (
    <section className="flex flex-col gap-[var(--spacing-12)]">
      <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
        {title}
      </h2>
      <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)] whitespace-pre-wrap">
        {body}
      </p>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-[var(--spacing-12)] py-[var(--spacing-6)] rounded-[var(--radius-40)] bg-[var(--color-violet-1)] text-[length:var(--font-size-14)] leading-[var(--line-height-130)] text-[color:var(--color-grey-black)]">
      {children}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <dt className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">{label}</dt>
      <dd className="text-[length:var(--font-size-16)] font-[var(--font-weight-medium)] capitalize">{value}</dd>
    </div>
  );
}
