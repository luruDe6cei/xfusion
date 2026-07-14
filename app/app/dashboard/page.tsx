import Link from 'next/link';
import { getCompany, challengesByCompany, solutionsByCompany } from '@/lib/data';
import { DashShell } from './dash-shell';

/**
 * /dashboard — the logged-in home (captured: auth-shots/dashboard.png).
 * Left: company card. Right: four stat tiles + Recent Challenges/Solutions panels.
 *
 * The signed-in account is simulated (lib/mock-auth.ts); its company is hardwired
 * to Cloudcompanion Io — the same org the real test account owns — so the numbers
 * come from our DB and match what the real dashboard showed (0 / 0 / 0 / 1).
 */

const MOCK_COMPANY_SLUG = 'cloudcompanion';

const TILES = [
  { label: 'Published Challenges', bar: 'var(--color-orange-1)', tint: 'var(--gradient-warning-card)' },
  { label: 'Published Solutions', bar: 'var(--color-green-1)', tint: 'var(--gradient-success-card)' },
  { label: 'Total Proposals', bar: 'var(--color-violet-4)', tint: 'var(--gradient-matched-card)' },
  { label: 'Team Members', bar: 'var(--color-violet-6)', tint: 'var(--gradient-info-card)' },
] as const;

export default async function DashboardPage() {
  const company = await getCompany(MOCK_COMPANY_SLUG);
  const ch = company ? await challengesByCompany(company.id) : [];
  const so = company ? await solutionsByCompany(company.id) : [];
  const counts = [ch.length, so.length, 0, 1]; // proposals aren't public data; team = the one mock user

  return (
    <DashShell>
      <div className="grid gap-[var(--spacing-24)] lg:grid-cols-[300px_1fr] items-start">
        {/* Company card */}
        <aside className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] overflow-hidden">
          <div className="hero-banner--explore" style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="w-[72px] h-[72px] rounded-[var(--radius-8)] bg-[var(--color-grey-white)] flex items-center justify-center text-[length:var(--font-size-24)]">
              {company?.name?.[0] ?? 'C'}
            </span>
          </div>
          <div className="p-[var(--spacing-20)] flex flex-col gap-[var(--spacing-16)]">
            <Field label="Company Name" value={company?.name ?? 'Cloudcompanion Io'} />
            <Field label="Website" value={company?.website ?? 'https://cloudcompanion.io'} />
            <Field label="Description" value={company?.description ?? 'Small business'} />
            <Link href={`/organizations/${company?.slug ?? MOCK_COMPANY_SLUG}`} className="btn btn-outline w-full justify-center">
              Public Company page ↗
            </Link>
          </div>
        </aside>

        <div className="flex flex-col gap-[var(--spacing-24)] min-w-0">
          {/* Stat tiles */}
          <div className="grid gap-[var(--spacing-16)] sm:grid-cols-2 xl:grid-cols-4">
            {TILES.map((t, i) => (
              <div key={t.label} className="flex rounded-[var(--radius-4)] overflow-hidden" style={{ background: t.tint }}>
                <span className="w-[6px] shrink-0" style={{ background: t.bar }} />
                <div className="p-[var(--spacing-20)] flex flex-col gap-[var(--spacing-8)]">
                  <span className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-100)]">
                    {counts[i]}
                  </span>
                  <span className="text-[length:var(--font-size-16)]">{t.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent panels */}
          <div className="grid gap-[var(--spacing-24)] lg:grid-cols-2">
            <RecentPanel title="Recent Challenges" accent="var(--color-orange-1)" items={ch.slice(0, 3).map((c) => ({ name: c.name, href: `/challenges/${c.slug}` }))} emptyText="No challenges were created yet" cta="New Challenge" />
            <RecentPanel title="Recent Solutions" accent="var(--color-green-1)" items={so.slice(0, 3).map((s) => ({ name: s.name, href: `/solutions/${s.slug}` }))} emptyText="No Solutions were created yet" cta="New Solution" />
          </div>
        </div>
      </div>
    </DashShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-semibold)]">{label}</span>
      <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] break-words">{value}</span>
    </div>
  );
}

function RecentPanel({ title, accent, items, emptyText, cta }: {
  title: string;
  accent: string;
  items: { name: string; href: string }[];
  emptyText: string;
  cta: string;
}) {
  return (
    <section className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] p-[var(--spacing-24)] min-h-[420px] flex flex-col">
      <div className="flex items-center gap-[var(--spacing-10)] pb-[var(--spacing-16)] border-b border-solid border-[var(--color-grey-2)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
        <h2 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)]">{title}</h2>
      </div>
      {items.length ? (
        <ul className="flex flex-col gap-[var(--spacing-12)] py-[var(--spacing-16)]">
          {items.map((i) => (
            <li key={i.href}><Link href={i.href} className="hover:text-[color:var(--color-primary)]">{i.name}</Link></li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-[var(--spacing-20)]">
          <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">{emptyText}</p>
          <span className="flex items-center gap-[var(--spacing-12)] h-[48px] px-[var(--spacing-32)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)]" title="Write flows aren't built yet">
            {cta} <span aria-hidden="true">＋</span>
          </span>
        </div>
      )}
    </section>
  );
}
