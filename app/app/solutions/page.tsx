import { getSolutions } from '@/lib/data';

import { HeroBanner, FilterableList } from '../list-chrome';

export default async function SolutionsPage() {
  const solutions = await getSolutions();
  return (
    <>
      <HeroBanner title="Solutions" variant="solutions" />
      <FilterableList
        items={solutions}
        kind="solutions"
      />
    </>
  );
}
