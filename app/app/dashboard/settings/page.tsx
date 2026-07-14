import { getCompany } from '@/lib/data';
import { DashShell } from '../dash-shell';

/** "Company Settings" — form fields prefilled from the mock account's company.
    Saving needs write paths that aren't built; inputs are display-only. */
export default async function CompanySettings() {
  const c = await getCompany('cloudcompanion');
  return (
    <DashShell>
      <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] mb-[var(--spacing-24)]">
        Company Settings
      </h1>
      <div className="max-w-[720px] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] p-[var(--spacing-32)] flex flex-col gap-[var(--spacing-20)]">
        {[
          ['Company Name', c?.name ?? 'Cloudcompanion Io'],
          ['Website', c?.website ?? 'https://cloudcompanion.io'],
          ['Description', c?.description ?? 'Small business'],
        ].map(([label, value]) => (
          <label key={label} className="flex flex-col gap-[var(--spacing-6)]">
            <span className="text-[length:var(--font-size-14)]">{label}</span>
            <input
              defaultValue={value ?? ''}
              disabled
              className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] text-[length:var(--font-size-16)] bg-[var(--color-grey-1)]"
            />
          </label>
        ))}
        <span className="btn btn-primary w-fit self-end" title="Write flows aren't built yet">Save Changes</span>
      </div>
    </DashShell>
  );
}
