import { getChallenge, getChallenges } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return (await getChallenges()).map((c) => ({ slug: c.slug }));
}

export default async function ChallengeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getChallenge(slug);
  if (!c) notFound();

  const logo = c.company?.logo?.thumbnailUrl || c.company?.logo?.url;

  return (
    <article style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {c.industry && <span className="badge">{c.industry.name}</span>}
        {c.subIndustry && <span className="chip">{c.subIndustry.name}</span>}
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.15 }}>{c.name}</h1>

      <Link href={`/organizations/${c.company?.slug}`} style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '18px 0 28px' }}>
        {logo && /* eslint-disable-next-line @next/next/no-img-element */ (
          <img src={logo} alt="" width={32} height={32} style={{ borderRadius: 8 }} />
        )}
        <span className="muted">By {c.company?.name}</span>
      </Link>

      <Field label="Description" value={c.description || c.shortDescription} />
      <Field label="Objective" value={c.objective} />

      {c.requiredExpertise?.length > 0 && (
        <Block label="Required expertise">
          {c.requiredExpertise.map((e) => <span key={e} className="chip">{e}</span>)}
        </Block>
      )}
      {c.keywords?.length > 0 && (
        <Block label="Keywords">
          {c.keywords.map((k) => <span key={k} className="chip">{k}</span>)}
        </Block>
      )}

      <div className="card" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <Stat label="Reward" value={c.rewardInformation ? c.rewardInformation.split('\n')[0].slice(0, 40) : '—'} />
        <Stat label="Deployment" value={c.requiredDeploymentTime?.replaceAll('_', ' ').toLowerCase() || '—'} />
        <Stat label="Match score" value={c.averageMatchScore ? `${Math.round(c.averageMatchScore)}%` : '—'} />
        <Stat label="Views" value={String(c.viewsCount)} />
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 className="muted" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{label}</h3>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{value}</p>
    </section>
  );
}
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 className="muted" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>{label}</h3>
      <div>{children}</div>
    </section>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
