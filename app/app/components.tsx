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
            <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-130)] text-[color:var(--color-grey-black)] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {industry}
            </span>
          </div>
        )}
        <div
          className="inline-flex items-center gap-[8px] px-[12px] py-[6px] h-[40px] shrink-0 rounded-tr-[4px] rounded-bl-[4px] rounded-br-[4px]"
          style={{ background: 'var(--gradient-success-card)' }}
        >
          <CheckIcon />
          <span className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-130)] whitespace-nowrap text-[color:var(--color-grey-black)]">
            Active
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-regular)] leading-[var(--line-height-120)] text-[color:var(--color-grey-5)] whitespace-nowrap">
          {fmtDate(date)}
        </span>
      </div>
    </div>
  );
}

/** Upstream shows keywords as pills with a "+N" overflow chip, capped at 1 visible. */
function Keywords({ keywords }: { keywords?: string[] }) {
  if (!keywords?.length) return null;
  const [first, ...rest] = keywords;
  return (
    <div className="flex items-center gap-[8px] flex-wrap">
      <span className="px-[10px] py-[4px] rounded-[var(--radius-4)] bg-[var(--color-grey-2)] text-[length:var(--font-size-14)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)] truncate max-w-[190px]">
        {first}
      </span>
      {rest.length > 0 && (
        <span className="px-[10px] py-[4px] rounded-[var(--radius-4)] bg-[var(--color-grey-2)] text-[length:var(--font-size-14)] leading-[var(--line-height-120)] text-[color:var(--color-grey-5)]">
          +{rest.length}
        </span>
      )}
    </div>
  );
}

/** The outlined "… Details →" button that closes every card upstream. */
function DetailsButton({ label }: { label: string }) {
  return (
    <span className="mt-auto w-full h-[44px] px-[var(--spacing-16)] flex items-center justify-between rounded-[var(--radius-40)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] bg-[var(--color-grey-white)] group-hover:border-[var(--color-primary)] transition-colors">
      {label}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </span>
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
        <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
          {company?.name?.[0] || '?'}
        </span>
      )}
    </div>
  );
}

/** Shared shell — upstream's card: grey-1 fill, 8px radius, grey-3 border, 24px pad with a flush left edge. */
const CARD =
  'group bg-[var(--color-grey-white)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] ' +
  'flex flex-col gap-[20px] p-[24px] ps-0 h-full relative transition-shadow hover:shadow-[var(--shadow-card)]';

export function ChallengeCard({ c }: { c: Challenge }) {
  return (
    <Link href={`/challenges/${c.slug}`} className={CARD}>
      <CardHeader industry={c.industry?.name} date={c.createdAt} />
      <div className="flex flex-col flex-1 gap-[16px] ps-[24px]">
        <div className="flex flex-col gap-[4px]">
          <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)] line-clamp-2">
            {c.name}
          </h3>
          {/* Upstream prints "By <org>" as text — no logo on list cards. */}
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] truncate">
            By {c.company?.name}
          </span>
          <p className="mt-[8px] text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[color:var(--color-grey-5)] line-clamp-3">
            {c.shortDescription}
          </p>
        </div>
        <Keywords keywords={c.keywords} />
        <DetailsButton label="Challenge Details" />
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
          <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)] line-clamp-2">
            {s.name}
          </h3>
          <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] truncate">
            By {s.company?.name}
          </span>
          <p className="mt-[8px] text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[color:var(--color-grey-5)] line-clamp-3">
            {s.shortDescription}
          </p>
        </div>
        <Keywords keywords={s.keywords} />
        <DetailsButton label="Solution Details" />
      </div>
    </Link>
  );
}

/** Building glyph the org cards use upstream, in place of a company logo. */
function BuildingIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--color-violet-upload)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 21V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15" />
      <path d="M15 10h4a1 1 0 0 1 1 1v10" />
      <path d="M8 8h3M8 12h3M8 16h3M2 21h20" />
    </svg>
  );
}

export function CompanyCard({ c }: { c: Company; counts?: { ch: number; so: number } }) {
  return (
    <Link
      href={`/organizations/${c.slug}`}
      className="group bg-[var(--color-grey-white)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] flex flex-col gap-[16px] p-[24px] h-full transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      {/* Upstream shows a violet building icon, not the company logo. */}
      <div className="w-[80px] h-[80px] flex items-center justify-center rounded-[var(--radius-8)] bg-[var(--color-violet-1)]">
        <BuildingIcon />
      </div>
      <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
        {c.name}
      </h3>
      <p className="text-[length:var(--font-size-16)] font-[var(--font-weight-regular)] leading-[var(--line-height-140)] text-[color:var(--color-grey-5)] line-clamp-2">
        {c.description}
      </p>
      <span className="mt-auto w-full h-[44px] px-[var(--spacing-16)] flex items-center justify-between rounded-[var(--radius-40)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] bg-[var(--color-grey-white)] group-hover:border-[var(--color-primary)] transition-colors">
        Company page
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
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
        <Link href={href} className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:text-[color:var(--color-primary)]">
          {cta || 'View all'} →
        </Link>
      )}
    </div>
  );
}
