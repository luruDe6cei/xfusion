import { getSolution, getSolutions } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DetailActions } from '../../detail-actions';

/**
 * Solution detail — mirrors the real page (scraper/snapshot/html/solutions/*.html):
 *   Background   → company.description   (the ORG's blurb, not a solution field)
 *   The Solution → shortDescription
 *
 * Upstream hides implementationMethodology / previousImplementations behind a
 * "Read More" toggle; we render them inline — same data, no collapsed state.
 * There is NO `description` field on a solution upstream.
 */

export async function generateStaticParams() {
  return (await getSolutions()).map((s) => ({ slug: s.slug }));
}

const ordinal = (n: number) => {
  const suf = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suf[(v - 20) % 10] || suf[v] || suf[0]);
};
const longDate = (d: Date | string) => {
  const x = new Date(d);
  return `${x.toLocaleString('en-US', { month: 'long' })} ${ordinal(x.getDate())}, ${x.getFullYear()}`;
};

export default async function SolutionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSolution(slug);
  if (!s) notFound();

  const logo = s.company?.logo?.thumbnailUrl || s.company?.logo?.url;

  return (
    <article className="py-[var(--spacing-40)] grid gap-[var(--spacing-40)] lg:grid-cols-[1fr_320px] items-start">
      <div className="flex flex-col gap-[var(--spacing-32)] min-w-0">
        <header className="flex flex-col gap-[var(--spacing-16)]">
          {s.industry && (
            <div className="flex items-center gap-[var(--spacing-8)] flex-wrap">
              <span className="h-[40px] px-[var(--spacing-24)] flex items-center bg-[var(--color-violet-3)] text-[length:var(--font-size-16)] leading-[var(--line-height-130)]">
                {s.industry.name}
              </span>
            </div>
          )}

          <h1 className="text-[length:var(--font-size-44)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
            {s.name}
          </h1>

          <Link href={`/organizations/${s.company?.slug}`} className="flex items-center gap-[var(--spacing-12)] w-fit">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={40} height={40} className="rounded-[var(--radius-4)] object-cover" />
            )}
            <span className="text-[length:var(--font-size-16)] text-[color:var(--color-grey-5)]">{s.company?.name}</span>
          </Link>
        </header>

        <Section title="Background" body={s.company?.description} />
        <Section title="The Solution" body={s.shortDescription} />
        <Section title="Implementation Methodology" body={s.implementationMethodology} />
        <Section title="Required Resources" body={s.requiredResources} />
        <Section title="Previous Implementations" body={s.previousImplementations} />

        {s.keywords?.length > 0 && (
          <section className="flex flex-col gap-[var(--spacing-12)]">
            <h3 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)]">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {s.keywords.map((k) => (
                <span
                  key={k}
                  className="px-[var(--spacing-12)] py-[var(--spacing-6)] rounded-[var(--radius-40)] bg-[var(--color-violet-1)] text-[length:var(--font-size-14)] leading-[var(--line-height-130)]"
                >
                  {k}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-[88px] w-full flex flex-col gap-[var(--spacing-16)] p-[var(--spacing-24)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]">
        <div className="flex flex-col gap-[var(--spacing-4)]">
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">Published Date</span>
          <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-medium)]">
            {longDate(s.createdAt)}
          </span>
        </div>

        <DetailActions slug={s.slug} kind="solution" />

        <dl className="grid grid-cols-2 gap-[var(--spacing-12)] pt-[var(--spacing-16)] border-t border-solid border-[var(--color-grey-2)]">
          <Meta
            label="Time to implement"
            value={s.timeToImplement ? s.timeToImplement.replaceAll('_', ' ').toLowerCase() : '—'}
          />
          <Meta label="Views" value={String(s.viewsCount)} />
          {s.estimatedCost && <Meta label="Estimated cost" value={s.estimatedCost} />}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <dt className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">{label}</dt>
      <dd className="text-[length:var(--font-size-16)] font-[var(--font-weight-medium)] capitalize">{value}</dd>
    </div>
  );
}
