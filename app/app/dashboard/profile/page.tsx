import { DashShell } from '../dash-shell';

/** "Profile Settings" + "Notifications Settings" — from the user's capture of
    xfusion.pro/dashboard/profile. Saving/toggling needs auth + writes (not built). */
export default function ProfileSettings() {
  return (
    <DashShell>
      <div className="grid gap-[var(--spacing-24)] lg:grid-cols-[1fr_420px] items-start">
        <section className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] p-[var(--spacing-32)] flex flex-col gap-[var(--spacing-20)]">
          <h1 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)]">Profile Settings</h1>
          <div className="grid gap-[var(--spacing-16)] sm:grid-cols-3">
            <Input label="First name*" value="Alon" />
            <Input label="Last name*" value="Erza" />
            <Input label="Prefix" value="Mr" />
          </div>
          <div className="grid gap-[var(--spacing-16)] sm:grid-cols-2">
            <Input label="Professional Title*" value="CEO" />
            <Input label="Email" value="ehavreliuc@cloudcompanion.io" />
          </div>
          <Input label="Professional Bio*" value="TBD" />
          <span className="btn btn-primary w-fit self-end" title="Write flows aren't built yet">Save Changes</span>
        </section>

        <section className="rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] p-[var(--spacing-32)] flex flex-col gap-[var(--spacing-16)]">
          <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)]">Notifications Settings</h2>
          {[
            ['New solution Responses', 'Receive notifications about new solution responses', 'var(--color-green-1)'],
            ['Message Notifications', 'Receive notifications about messages', 'var(--color-violet-5)'],
            ['Challenge Updates', 'Receive notifications about challenge updates', 'var(--color-orange-1)'],
          ].map(([title, body, dot]) => (
            <div key={title} className="flex items-center gap-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-2)] p-[var(--spacing-16)]">
              <span className="w-[10px] h-[10px] rounded-full shrink-0" style={{ background: dot }} />
              <div className="flex-1">
                <h3 className="text-[length:var(--font-size-16)] font-[var(--font-weight-medium)]">{title}</h3>
                <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">{body}</p>
              </div>
              <span className="w-[44px] h-[24px] rounded-full bg-[var(--color-violet-6)] relative shrink-0">
                <span className="absolute right-[3px] top-[3px] w-[18px] h-[18px] rounded-full bg-white" />
              </span>
            </div>
          ))}
        </section>
      </div>
    </DashShell>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-[var(--spacing-6)]">
      <span className="text-[length:var(--font-size-14)]">{label}</span>
      <input
        defaultValue={value}
        disabled
        className="h-[48px] px-[var(--spacing-16)] rounded-[var(--radius-4)] border border-solid border-[var(--color-border-input)] text-[length:var(--font-size-16)] bg-[var(--color-grey-1)]"
      />
    </label>
  );
}
