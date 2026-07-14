import Link from 'next/link';

/**
 * The compact card used in the landing page's Featured Challenges/Solutions
 * sections (captured: auth-shots/index.png) — smaller than the list-page cards:
 * circular logo, title, "by <org>", clamped text, one keyword pill + "+N",
 * and a full-width outlined "View …" pill.
 */
export function FeaturedCard({ href, name, by, text, keywords, logo, cta }: {
  href: string;
  name: string;
  by?: string | null;
  text?: string | null;
  keywords?: string[];
  logo?: string | null;
  cta: string;
}) {
  const [first, ...rest] = keywords ?? [];
  return (
    <Link href={href} className="group bg-[var(--color-grey-white)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] flex flex-col gap-[var(--spacing-12)] p-[var(--spacing-24)] h-full transition-shadow hover:shadow-[var(--shadow-card)]">
      <span className="w-[48px] h-[48px] rounded-full bg-[var(--color-grey-2)] flex items-center justify-center overflow-hidden shrink-0">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={48} height={48} style={{ objectFit: 'cover' }} />
        ) : (
          <span className="text-[color:var(--color-grey-5)]">{by?.[0] ?? '?'}</span>
        )}
      </span>
      <div>
        <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] line-clamp-2">{name}</h3>
        {by && <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">by {by}</span>}
      </div>
      <p className="text-[length:var(--font-size-14)] leading-[var(--line-height-140)] text-[color:var(--color-grey-5)] line-clamp-4">{text}</p>
      {first && (
        <div className="flex items-center gap-[var(--spacing-8)] mt-auto">
          <span className="px-[10px] py-[4px] rounded-[var(--radius-4)] bg-[var(--color-grey-2)] text-[length:var(--font-size-14)] truncate max-w-[180px]">{first}</span>
          {rest.length > 0 && (
            <span className="px-[10px] py-[4px] rounded-[var(--radius-4)] bg-[var(--color-grey-2)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">+{rest.length}</span>
          )}
        </div>
      )}
      <span className="w-full h-[44px] px-[var(--spacing-16)] flex items-center justify-between rounded-[var(--radius-40)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] group-hover:border-[var(--color-primary)] transition-colors">
        {cta}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </span>
    </Link>
  );
}
