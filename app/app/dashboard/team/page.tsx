import { DashShell } from '../dash-shell';

/** "Team Members" — the mock account has exactly one member, matching the real
    test account's dashboard (Team Members: 1). */
export default function MyTeam() {
  return (
    <DashShell>
      <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] mb-[var(--spacing-24)]">
        Team Members
      </h1>
      <div className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] overflow-hidden">
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] gap-[var(--spacing-16)] items-center px-[var(--spacing-24)] py-[var(--spacing-16)] border-b border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
          <span /> <span>Name</span> <span>Role</span> <span>Email</span>
        </div>
        <div className="grid grid-cols-[56px_1fr_1fr_1fr] gap-[var(--spacing-16)] items-center px-[var(--spacing-24)] py-[var(--spacing-16)]">
          <span className="w-[40px] h-[40px] rounded-full bg-[var(--color-grey-2)] flex items-center justify-center">A</span>
          <span>Alon Erza</span>
          <span className="text-[color:var(--color-grey-5)]">CEO · Owner</span>
          <span className="text-[color:var(--color-grey-5)]">ehavreliuc@cloudcompanion.io</span>
        </div>
      </div>
    </DashShell>
  );
}
