import { getSolutions } from '@/lib/data';
import { SolutionCard, SectionHeader } from '../components';

export default async function SolutionsPage() {
  const solutions = await getSolutions();
  return (
    <div>
      <SectionHeader title={`Solutions (${solutions.length})`} />
      <div className="grid-cards">
        {solutions.map((s) => <SolutionCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}
