import Link from 'next/link';
import type { Challenge, Solution, Company } from '@/lib/types';

function Logo({ company, size = 36 }: { company?: Company | null; size?: number }) {
  const url = company?.logo?.thumbnailUrl || company?.logo?.url;
  return (
    <div style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden', background: 'var(--panel-2)', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={company?.name || ''} width={size} height={size} style={{ objectFit: 'cover' }} />
      ) : (
        <span className="muted" style={{ fontSize: 14 }}>{company?.name?.[0] || '?'}</span>
      )}
    </div>
  );
}

export function ChallengeCard({ c }: { c: Challenge }) {
  return (
    <Link href={`/challenges/${c.slug}`} className="card" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        {c.industry && <span className="badge">{c.industry.name}</span>}
        <span className="muted" style={{ fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{c.name}</h3>
      <p className="muted clamp-3" style={{ fontSize: 14, lineHeight: 1.5 }}>{c.shortDescription}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <Logo company={c.company} size={28} />
        <span className="muted" style={{ fontSize: 13 }}>{c.company?.name}</span>
      </div>
    </Link>
  );
}

export function SolutionCard({ s }: { s: Solution }) {
  return (
    <Link href={`/solutions/${s.slug}`} className="card" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        {s.industry && <span className="badge">{s.industry.name}</span>}
        <span className="muted" style={{ fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.name}</h3>
      <p className="muted clamp-3" style={{ fontSize: 14, lineHeight: 1.5 }}>{s.shortDescription}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <Logo company={s.company} size={28} />
        <span className="muted" style={{ fontSize: 13 }}>{s.company?.name}</span>
      </div>
    </Link>
  );
}

export function CompanyCard({ c, counts }: { c: Company; counts?: { ch: number; so: number } }) {
  return (
    <Link href={`/organizations/${c.slug}`} className="card" style={{ display: 'block' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <Logo company={c} />
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</h3>
      </div>
      <p className="muted clamp-2" style={{ fontSize: 14, lineHeight: 1.5 }}>{c.description}</p>
      {counts && (
        <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          {counts.ch} challenges · {counts.so} solutions
        </div>
      )}
    </Link>
  );
}

export function SectionHeader({ title, href, cta }: { title: string; href?: string; cta?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 18px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>{title}</h2>
      {href && <Link href={href} className="muted" style={{ fontSize: 14 }}>{cta || 'View all'} →</Link>}
    </div>
  );
}
