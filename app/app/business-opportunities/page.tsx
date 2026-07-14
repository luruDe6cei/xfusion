import { DashShell, ManagementHeader, EmptyPanel } from '../dashboard/dash-shell';

/** "My Business Opportunities" tab → /business-opportunities (NOT under /dashboard —
    traced from the live site's client-side navigation). */
export default function BusinessOpportunities() {
  return (
    <DashShell>
      <ManagementHeader
        title="Business Opportunities"
        filters={['All', 'New', 'In Progress', 'Closed']}
        cta="Explore Challenges"
        count="0 opportunities"
        searchPlaceholder="Search opportunities..."
      />
      <EmptyPanel text="No business opportunities yet" />
    </DashShell>
  );
}
