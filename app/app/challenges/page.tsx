import { getChallenges } from '@/lib/data';
import Link from 'next/link';

import { HeroBanner, FilterableList } from '../list-chrome';

export default async function ChallengesPage() {
  const challenges = await getChallenges();
  return (
    <>
      <HeroBanner title="Challenges" variant="challenges" />
      <div className="flex justify-end pt-[var(--spacing-24)]">
        <Link
          href="/challenges/new"
          className="h-[44px] px-[var(--spacing-24)] flex items-center gap-[var(--spacing-8)] rounded-[var(--radius-40)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-white)] hover:opacity-90"
          style={{ background: 'var(--gradient-ai)' }}
        >
          ✦ Submit a Challenge with AI
        </Link>
      </div>
      <FilterableList
        items={challenges}
        kind="challenges"
      />
    </>
  );
}
