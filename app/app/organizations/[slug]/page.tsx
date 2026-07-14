import { getCompany, getCompanies, challengesByCompany, solutionsByCompany } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ChallengeCard, SolutionCard, SectionHeader } from '../../components';

export async function generateStaticParams() {
  return (await getCompanies())
    .filter((c) => typeof c.slug === 'string' && c.slug.length > 0)
    .map((c) => ({ slug: c.slug }));
}

export default async function OrgDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCompany(slug);
  if (!c) notFound();
  const logo = c.logo?.thumbnailUrl || c.logo?.url;
  const challenges = await challengesByCompany(c.id);
  const solutions = await solutionsByCompany(c.id);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        {logo && /* eslint-disable-next-line @next/next/no-img-element */ (
          <img src={logo} alt="" width={56} height={56} style={{ borderRadius: 12 }} />
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>{c.name}</h1>
          {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="muted" style={{ fontSize: 14 }}>{c.domain}</a>}
        </div>
      </div>
      <p className="muted" style={{ maxWidth: 720, lineHeight: 1.6, marginBottom: 40 }}>{c.description}</p>

      {challenges.length > 0 && (
        <>
          <SectionHeader title={`Challenges (${challenges.length})`} />
          <div className="grid-cards" style={{ marginBottom: 40 }}>
            {challenges.map((ch) => <ChallengeCard key={ch.id} c={ch} />)}
          </div>
        </>
      )}
      {solutions.length > 0 && (
        <>
          <SectionHeader title={`Solutions (${solutions.length})`} />
          <div className="grid-cards">
            {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
