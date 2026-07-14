import { DashShell, ManagementHeader, EmptyPanel } from '../dash-shell';

/** Captured: auth-shots/dashboard_challenges.png — the mock account owns none. */
export default function MyChallenges() {
  return (
    <DashShell>
      <ManagementHeader
        title="Challenges Management"
        filters={['All', 'Published', 'Draft', 'Closed', 'Matched']}
        cta="New Challenge"
        count="0 challenges"
        searchPlaceholder="Search challenges..."
      />
      <EmptyPanel text="No challenges found" />
    </DashShell>
  );
}
