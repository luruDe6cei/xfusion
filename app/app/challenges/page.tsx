import { getChallenges } from '@/lib/data';

import { HeroBanner, FilterableList } from '../list-chrome';

export default async function ChallengesPage() {
  const challenges = await getChallenges();
  return (
    <>
      <HeroBanner title="Challenges" variant="challenges" />
      <FilterableList
        items={challenges}
        kind="challenges"
      />
    </>
  );
}
