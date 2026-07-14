import Link from 'next/link';
import type { Challenge, Solution, Company } from '@/lib/types';

/**
 * Card markup mirrors the real xfusion.pro DOM (scraper/snapshot/html/challenges.html):
 * Tailwind arbitrary values bound to the upstream design tokens in globals.css
 * (--font-size-*, --spacing-*, --color-*, --gradient-*). Keep the class strings
 * as-is when syncing with upstream; only the data bindings are ours.
 *
 * The one deliberate deviation: upstream renders status/arrow glyphs from a
 * proprietary icon font (`.icon-check:before { content: "" }`). We use inline
 * SVG instead so we don't vendor their font.
 */

// Upstream formats dates as DD.MM.YY (e.g. "12.07.26").
const fmtDate = (d: Date | string) => {
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(x.getDate())}.${p(x.getMonth() + 1)}.${String(x.getFullYear()).slice(-2)}`;
};

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="var(--color-green-1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The industry pill + status pill + date row that tops every card. */
function CardHeader({ industry, date }: { industry?: string | null; date: Date | string }) {
  return (
    <div className="flex items-center justify-between w-full gap-[8px] min-w-0">
      <div className="flex items-center gap-[8px] min-w-0 flex-1 overflow-hidden">
        {industry && (
          <div className="h-[40px] px-[24px] pe-[12px] py-[8px] flex items-center justify-center shrink-0 bg-[var(--color-violet-3)]">
            <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-130)] text-[var(--color-grey-black)] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {industry}
            </span>
          </div>
        )}
        <div
          className="inline-flex items-center gap-[8px] px-[12px] py-[6px] h-[40px] shrink-0 rounded-tr-[4px] rounded-bl-[4px] rounded-br-[4px]"
          style={{ background: 'var(--gradient-success-card)' }}
        >
          <CheckIcon />
          <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-130)] whitespace-nowrap text-[var(--color-grey-black)]">
            Active
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-regular)] leading-[var(--line-height-120)] text-[var(--color-grey-5)] whitespace-nowrap">
          {fmtDate(date)}
        </span>
      </div>
    </div>
  );
}

function CardFooter({ company }: { company?: Company | null }) {
  return (
    <div className="flex items-center gap-[8px] mt-auto">
      <Logo company={company} size={32} />
      <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-regular)] leading-[var(--line-height-120)] text-[var(--color-grey-5)] truncate">
        {company?.name}
      </span>
    </div>
  );
}

function Logo({ company, size = 36 }: { company?: Company | null; size?: number }) {
  const url = company?.logo?.thumbnailUrl || company?.logo?.url;
  return (
    <div
      className="shrink-0 flex items-center justify-center overflow-hidden rounded-[var(--radius-4)] bg-[var(--color-grey-2)]"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={company?.name || ''} width={size} height={size} style={{ objectFit: 'cover' }} />
      ) : (
        <span className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)]">
          {company?.name?.[0] || '?'}
        </span>
      )}
    </div>
  );
}

/** Shared shell — upstream's card: grey-1 fill, 8px radius, grey-3 border, 24px pad with a flush left edge. */
const CARD =
  'bg-[var(--color-grey-1)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] ' +
  'flex flex-col gap-[20px] p-[24px] ps-0 h-full relative transition-shadow hover:shadow-[var(--shadow-card)]';

export function ChallengeCard({ c }: { c: Challenge }) {
  return (
    <Link href={`/challenges/${c.slug}`} className={CARD}>
      <CardHeader industry={c.industry?.name} date={c.createdAt} />
      <div className="flex flex-col flex-1 gap-[16px] ps-[24px]">
        <div className="flex flex-col gap-[4px]">
          <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[var(--color-grey-black)] line-clamp-2">
            {c.name}
          </h3>
          <p className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[var(--color-grey-5)] line-clamp-3">
            {c.shortDescription}
          </p>
        </div>
        <CardFooter company={c.company} />
      </div>
    </Link>
  );
}

export function SolutionCard({ s }: { s: Solution }) {
  return (
    <Link href={`/solutions/${s.slug}`} className={CARD}>
      <CardHeader industry={s.industry?.name} date={s.createdAt} />
      <div className="flex flex-col flex-1 gap-[16px] ps-[24px]">
        <div className="flex flex-col gap-[4px]">
          <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[var(--color-grey-black)] line-clamp-2">
            {s.name}
          </h3>
          <p className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[var(--color-grey-5)] line-clamp-3">
            {s.shortDescription}
          </p>
        </div>
        <CardFooter company={s.company} />
      </div>
    </Link>
  );
}

export function CompanyCard({ c, counts }: { c: Company; counts?: { ch: number; so: number } }) {
  return (
    <Link
      href={`/organizations/${c.slug}`}
      className="bg-[var(--color-grey-1)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] flex flex-col gap-[16px] p-[24px] h-full transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-[12px]">
        <Logo company={c} size={40} />
        <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[var(--color-grey-black)]">
          {c.name}
        </h3>
      </div>
      <p className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[var(--color-grey-5)] line-clamp-2">
        {c.description}
      </p>
      {counts && (
        <div className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)] mt-auto">
          {counts.ch} challenges · {counts.so} solutions
        </div>
      )}
    </Link>
  );
}

export function SectionHeader({ title, href, cta }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-[20px] mt-[8px]">
      <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)]">
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-[length:var(--font-size-14)] text-[var(--color-grey-5)] hover:text-[var(--color-primary)]">
          {cta || 'View all'} →
        </Link>
      )}
    </div>
  );
}
