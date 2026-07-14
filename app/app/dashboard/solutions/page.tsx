import { DashShell, ManagementHeader, EmptyPanel } from '../dash-shell';

/** Mirrors dashboard_solutions.png ("Solutions Management"). */
export default function MySolutions() {
  return (
    <DashShell>
      <ManagementHeader
        title="Solutions Management"
        filters={['All', 'Published', 'Draft', 'Matched']}
        cta="New Solution"
        count="0 solutions"
        searchPlaceholder="Search solutions..."
      />
      <EmptyPanel text="No solutions found" />
    </DashShell>
  );
}
