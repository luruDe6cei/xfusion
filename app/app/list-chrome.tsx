'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Challenge, Solution, Company } from '@/lib/types';
import { ChallengeCard, SolutionCard, CompanyCard } from './components';

/**
 * List-page chrome, captured from the live site (logged in) — each page differs:
 *
 *   /challenges    "Search challenges..."   Active · Domain · Category · Country · Newest First   orange
 *   /solutions     "Search for a solution"          Domain · Category · Country · Newest First   green
 *   /organizations "Search for a company"   (no filters)                                        violet
 *
 * Field mapping, confirmed against /api/industries/public/{domains,categories}:
 *   Domain   = Industry      (36 — exact match)
 *   Category = SubIndustry   (upstream has 20; we hold the 16 that are actually used)
 *   Country  = the company's country
 *
 * Upstream filters server-side (/api/challenges?skip=&take=). We filter the loaded
 * set on the client — the dataset is small (151 max) and this keeps the page
 * statically prerendered. Move to server filtering if the data grows.
 */

type Kind = 'challenges' | 'solutions' | 'organizations';

const THEME: Record<Kind, { accent: string; gradient: string; cta: string; search: string }> = {
  challenges: {
    accent: 'var(--color-orange-1)',
    gradient: 'var(--gradient-warning-card)',
    cta: 'Add your Challenge',
    search: 'Search challenges...',
  },
  solutions: {
    accent: 'var(--color-green-1)',
    gradient: 'var(--gradient-success-card)',
    cta: 'Add your Solution',
    search: 'Search for a solution',
  },
  organizations: {
    accent: 'var(--color-violet-upload)',
    gradient: 'var(--gradient-info-card)',
    cta: 'Add your company',
    search: 'Search for a company',
  },
};

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const ResultsIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

// Each list page has its own banner image upstream — challenges is orange,
// solutions green, organizations (banner-collaborators) violet, explore multi-colour.
// We approximate each with a CSS gradient rather than vendor the .webp files.
export function HeroBanner({ title, variant }: { title: string; variant: Kind | 'explore' }) {
  return (
    <div className={`hero-banner hero-banner--${variant} full-bleed`}>
      <h1 className="text-[length:var(--font-size-44)] font-[var(--font-weight-medium)] text-[var(--color-grey-white)] leading-[var(--line-height-120)]">
        {title}
      </h1>
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1 min-w-[170px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[48px] pl-[var(--spacing-16)] pr-[var(--spacing-40)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)] appearance-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-grey-5)]">
        <Chevron />
      </span>
    </div>
  );
}

type Item = (Challenge | Solution | Company) & Record<string, any>;

// NOTE: Client Component — every prop must be serializable, so cards are rendered
// here rather than passed in as a render function from the server page.
export function FilterableList({ items, kind }: { items: Item[]; kind: Kind }) {
  const t = THEME[kind];
  const isOrg = kind === 'organizations';

  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState('Newest First');

  const uniq = (fn: (i: Item) => string | undefined | null) =>
    [...new Set(items.map(fn).filter(Boolean))].sort() as string[];

  const domains = useMemo(() => uniq((i) => i.industry?.name), [items]);
  const categories = useMemo(() => uniq((i) => i.subIndustry?.name), [items]);
  const countries = useMemo(
    () => uniq((i) => (isOrg ? i.country?.name : i.company?.country?.name)),
    [items, isOrg]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = items.filter((i) => {
      if (domain && i.industry?.name !== domain) return false;
      if (category && i.subIndustry?.name !== category) return false;
      const c = isOrg ? i.country?.name : i.company?.country?.name;
      if (country && c !== country) return false;
      if (!needle) return true;
      return (
        i.name.toLowerCase().includes(needle) ||
        (i.shortDescription || i.description || '').toLowerCase().includes(needle) ||
        (i.keywords || []).some((k: string) => k.toLowerCase().includes(needle))
      );
    });
    if (!isOrg) {
      out.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sort === 'Oldest First' ? da - db : db - da;
      });
    }
    return out;
  }, [items, q, domain, category, country, sort, isOrg]);

  return (
    <div className="list-panel">
      <div className="relative">
        <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[var(--color-grey-5)]">
          <SearchIcon />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          className="w-full h-[52px] pl-[48px] pr-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]"
        />
      </div>

      {/* Organizations has no filter row upstream. */}
      {!isOrg && (
        <div className="flex flex-wrap gap-[var(--spacing-12)] mt-[var(--spacing-16)]">
          {/* Only challenges show the status pill. Every row we hold is PUBLISHED,
              so it's fixed rather than interactive. */}
          {kind === 'challenges' && (
            <div className="flex-1 min-w-[170px] h-[48px] px-[var(--spacing-16)] flex items-center justify-between rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] bg-[var(--color-grey-white)] text-[length:var(--font-size-16)]">
              <span>Active</span>
              <span className="text-[var(--color-grey-4)]">×</span>
            </div>
          )}
          <Select label="Domain" value={domain} options={domains} onChange={setDomain} />
          <Select label="Category" value={category} options={categories} onChange={setCategory} />
          <Select label="Country" value={country} options={countries} onChange={setCountry} />
          <Select
            label="Newest First"
            value={sort === 'Newest First' ? '' : sort}
            options={['Oldest First']}
            onChange={(v) => setSort(v || 'Newest First')}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-[var(--spacing-32)] pt-[var(--spacing-20)] border-t border-solid border-[var(--color-grey-2)]">
        <div className="flex items-center gap-[var(--spacing-10)]">
          <ResultsIcon color={t.accent} />
          <h2 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)]">Results</h2>
        </div>
        <span className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)]">
          {shown.length} Result{shown.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid-3 mt-[var(--spacing-20)]">
        {shown.map((i) =>
          kind === 'challenges' ? (
            <ChallengeCard key={i.id} c={i as Challenge} />
          ) : kind === 'solutions' ? (
            <SolutionCard key={i.id} s={i as Solution} />
          ) : (
            <CompanyCard key={i.id} c={i as Company} />
          )
        )}
        <AddCTA kind={kind} />
      </div>

      {shown.length === 0 && (
        <p className="text-[var(--color-grey-5)] py-[var(--spacing-40)] text-center">
          Nothing matches those filters.
        </p>
      )}
    </div>
  );
}

/** Upstream splices a CTA card into the grid, tinted per page. Inert — creating
    content needs auth + write paths that don't exist (HANDOFF.md). */
function AddCTA({ kind }: { kind: Kind }) {
  const t = THEME[kind];
  const heading =
    kind === 'challenges'
      ? 'Do you have a complex challenge?'
      : kind === 'solutions'
        ? 'Do you have a solution to share?'
        : 'Is your company missing?';
  return (
    <div
      className="flex flex-col items-center justify-center gap-[var(--spacing-20)] p-[var(--spacing-24)] rounded-[var(--radius-8)] border border-solid text-center min-h-[280px]"
      style={{ background: t.gradient, borderColor: t.accent }}
    >
      <h3 className="text-[length:var(--font-size-20)] font-[var(--font-weight-semibold)] leading-[var(--line-height-130)]">
        {heading}
      </h3>
      <Link href="/auth/login" className="btn btn-outline">
        {t.cta} <span aria-hidden="true">＋</span>
      </Link>
    </div>
  );
}
