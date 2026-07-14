import { getChallenges, getSolutions } from '@/lib/data';
import { ChallengeCard, SolutionCard, SectionHeader } from './components';

export default async function ExplorePage() {
  const challenges = (await getChallenges()).slice(0, 6);
  const solutions = (await getSolutions()).slice(0, 6);
  return (
    <div>
      <section style={{ padding: '20px 0 40px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, maxWidth: 760 }}>
          Where organizations post real challenges and solvers bring solutions.
        </h1>
        <p className="muted" style={{ fontSize: 18, marginTop: 16, maxWidth: 640 }}>
          Explore open business challenges and vetted solutions across industries.
        </p>
      </section>

      <SectionHeader title="Challenges" href="/challenges" />
      <div className="grid-cards">
        {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
      </div>

      <div style={{ height: 48 }} />

      <SectionHeader title="Solutions" href="/solutions" />
      <div className="grid-cards">
        {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}
