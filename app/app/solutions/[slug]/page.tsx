import { getSolution, getSolutions } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return (await getSolutions()).map((s) => ({ slug: s.slug }));
}

export default async function SolutionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSolution(slug);
  if (!s) notFound();
  const logo = s.company?.logo?.thumbnailUrl || s.company?.logo?.url;

  return (
    <article style={{ maxWidth: 820, margin: '0 auto' }}>
      {s.industry && <span className="badge">{s.industry.name}</span>}
      <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.15, marginTop: 12 }}>{s.name}</h1>

      <Link href={`/organizations/${s.company?.slug}`} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '18px 0 28px' }}>
        {logo && /* eslint-disable-next-line @next/next/no-img-element */ (
          <img src={logo} alt="" width={32} height={32} style={{ borderRadius: 8 }} />
        )}
        <span className="muted">By {s.company?.name}</span>
      </Link>

      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, marginBottom: 24 }}>
        {s.description || s.shortDescription}
      </p>

      {s.keywords?.length > 0 && (
        <div>{s.keywords.map((k) => <span key={k} className="chip">{k}</span>)}</div>
      )}
    </article>
  );
}
