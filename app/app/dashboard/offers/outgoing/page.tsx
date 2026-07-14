import { DashShell, ManagementHeader, EmptyPanel } from '../../dash-shell';

export default function OutgoingProposals() {
  return (
    <DashShell>
      <ManagementHeader
        title="Proposals Management"
        filters={['Outgoing', 'Incoming']}
        cta="New Proposal"
        count="0 proposals"
        searchPlaceholder="Search proposals..."
      />
      <EmptyPanel text="No proposals found" />
    </DashShell>
  );
}
