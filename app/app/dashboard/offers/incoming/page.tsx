import { DashShell, ManagementHeader, EmptyPanel } from '../../dash-shell';

/** "My Proposals" tab → /dashboard/offers/incoming (traced from the live site). */
export default function IncomingProposals() {
  return (
    <DashShell>
      <ManagementHeader
        title="Proposals Management"
        filters={['Incoming', 'Outgoing']}
        cta="New Proposal"
        count="0 proposals"
        searchPlaceholder="Search proposals..."
      />
      <EmptyPanel text="No proposals found" />
    </DashShell>
  );
}
