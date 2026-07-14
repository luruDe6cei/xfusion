'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Chrome shared by the dashboard tab pages (captured: auth-shots/dashboard*.png):
 * multi-colour banner with a floating building-icon card, then the tab bar.
 * Rendered inside each tab page — NOT a layout.tsx — because /dashboard/offers/new
 * and /dashboard/mailbox/* live under the same URL prefix but show none of this.
 *
 * Tab targets are the real routes traced from the live site (My Proposals is
 * /dashboard/offers/incoming; Business Opportunities is NOT under /dashboard).
 */

const TABS = [
  ['/dashboard', 'Dashboard'],
  ['/dashboard/challenges', 'My Challenges'],
  ['/dashboard/solutions', 'My Solutions'],
  ['/dashboard/offers/incoming', 'My Proposals'],
  ['/business-opportunities', 'My Business Opportunities'],
  ['/dashboard/team', 'My Team'],
  ['/dashboard/settings', 'Settings'],
] as const;

function BuildingIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-violet-upload)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
      <path d="M9 7h3M9 11h3M9 15h3M16 8v13M3 21h18" strokeDasharray="0" />
    </svg>
  );
}

export function DashShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      {/* Banner + floating company-icon card */}
      <div className="full-bleed hero-banner--explore" style={{ minHeight: 160, position: 'relative', marginBottom: 0 }}>
        <div className="absolute left-1/2 -translate-x-1/2 top-[52px] w-[160px] h-[160px] rounded-[var(--radius-12)] bg-[var(--color-grey-white)] shadow-[var(--shadow-card)] flex items-center justify-center">
          <BuildingIcon />
        </div>
      </div>

      {/* Tab bar */}
      <nav className="full-bleed bg-[var(--color-grey-white)] border-b border-solid border-[var(--color-grey-2)]" style={{ paddingTop: 60 }}>
        <div className="container flex items-center gap-[var(--spacing-8)] overflow-x-auto">
          {TABS.map(([href, label]) => {
            const active = href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap px-[var(--spacing-16)] py-[var(--spacing-16)] text-[length:var(--font-size-16)] border-b-2 border-solid"
                style={{
                  borderColor: active ? 'var(--color-grey-black)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="py-[var(--spacing-40)]">{children}</div>
    </>
  );
}

/** Title + status pills + search + count + CTA — the management-page header. */
export function ManagementHeader({
  title,
  filters,
  cta,
  count,
  searchPlaceholder,
}: {
  title: string;
  filters: string[];
  cta: string;
  count: string;
  searchPlaceholder: string;
}) {
  return (
    <header className="flex flex-col gap-[var(--spacing-20)]">
      <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)]">{title}</h1>
      <div className="flex items-center justify-between gap-[var(--spacing-16)] flex-wrap">
        <div className="flex gap-[var(--spacing-8)] flex-wrap">
          {filters.map((f, i) => (
            <span
              key={f}
              className="px-[var(--spacing-16)] py-[var(--spacing-7)] rounded-[var(--radius-8)] border border-solid text-[length:var(--font-size-16)]"
              style={
                i === 0
                  ? { background: 'var(--color-violet-6)', color: 'var(--color-grey-white)', borderColor: 'var(--color-violet-6)' }
                  : { borderColor: 'var(--color-violet-4)', color: 'var(--color-grey-black)' }
              }
            >
              {f}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-[var(--spacing-12)] h-[48px] px-[var(--spacing-24)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[var(--color-grey-white)] text-[length:var(--font-size-16)]" title="Write flows aren't built yet">
          {cta} <span aria-hidden="true">＋</span>
        </span>
      </div>
      <div className="flex items-center gap-[var(--spacing-16)]">
        <input
          placeholder={searchPlaceholder}
          disabled
          className="flex-1 h-[52px] px-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]"
        />
        <span className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)] whitespace-nowrap">{count}</span>
      </div>
    </header>
  );
}

/** The big bordered panel with an orange empty-state icon. */
export function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="mt-[var(--spacing-20)] min-h-[380px] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] flex flex-col items-center justify-center gap-[var(--spacing-16)]">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-1)" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" strokeDasharray="3 2.4" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <p className="text-[length:var(--font-size-16)]">{text}</p>
    </div>
  );
}
