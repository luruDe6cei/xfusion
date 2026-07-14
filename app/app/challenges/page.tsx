import { getChallenges } from '@/lib/data';
import { ChallengeCard, SectionHeader } from '../components';

export default async function ChallengesPage() {
  const challenges = await getChallenges();
  return (
    <div>
      <SectionHeader title={`Challenges (${challenges.length})`} />
      <div className="grid-cards">
        {challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}
