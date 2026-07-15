'use client';

import { useWizardDispatch, useWizardSelector } from '../store';
import { goToStep } from '../wizard-slice';
import { DEPLOYMENT_OPTIONS } from '@/lib/wizard-shared';

// Step 5 — Preview & Save (captured layout): per-section cards with an edit
// pencil that jumps back to the step, plus a live challenge-card preview.
// The Publish / Save as a Draft buttons live in the wizard footer.

export function ReviewStep() {
  const dispatch = useWizardDispatch();
  const f = useWizardSelector((s) => s.wizard.fields);
  const deployment =
    DEPLOYMENT_OPTIONS.find((o) => o.value === f.requiredDeploymentTime)?.label ?? '—';

  return (
    <div className="flex flex-col gap-[var(--spacing-16)]">
      <SectionCard icon="📄" title="Basic info" onEdit={() => dispatch(goToStep(1))}>
        <ValueCard label="Challenge Name" value={f.name} />
        <ValueCard label="Short Description" value={f.shortDescription} />
        <div className="grid grid-cols-2 gap-[var(--spacing-8)]">
          <ValueCard label="Domain" value={f.industry} />
          <ValueCard label="Category" value={f.category || '—'} />
        </div>
        <ChipsCard label="Keywords" values={f.keywords} />
      </SectionCard>

      <SectionCard icon="🎯" title="Objectives & Requirements" onEdit={() => dispatch(goToStep(2))}>
        <ValueCard label="Challenge Objective" value={f.objective} />
        <ValueCard label="Required Deployment Time" value={deployment} />
        <ChipsCard label="Required Expertise" values={f.requiredExpertise} />
      </SectionCard>

      <SectionCard icon="📎" title="Incentives & Supporting Data" onEdit={() => dispatch(goToStep(3))}>
        <ValueCard label="Incentives Information" value={f.rewardInformation} />
        <div className="rounded-[var(--radius-8)] bg-[var(--color-grey-white)] p-[var(--spacing-16)]">
          <p className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] mb-[var(--spacing-8)]">
            Supporting Documents
          </p>
          {f.files.length === 0 ? (
            <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
              No supporting documents attached yet
            </p>
          ) : (
            <ul className="flex flex-col gap-[var(--spacing-4)]">
              {f.files.map((file) => (
                <li key={file.url} className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)] truncate">
                  📄 {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      {/* Live challenge-card preview */}
      <div
        className="rounded-[var(--radius-12)] p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-16)]"
        style={{ background: 'var(--gradient-warning-card)' }}
      >
        <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
          <span aria-hidden className="mr-[var(--spacing-8)]">👁</span>
          Preview
        </h3>
        <div className="rounded-[var(--radius-12)] bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)] p-[var(--spacing-20)] flex flex-col gap-[var(--spacing-12)]">
          <div>
            <h4 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-130)] text-[color:var(--color-grey-black)]">
              {f.name || 'Your challenge title'}
            </h4>
            {f.industry && (
              <p className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] mt-[2px]">
                By {f.industry}
              </p>
            )}
          </div>
          <p className="text-[length:var(--font-size-14)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)] clamp-3">
            {f.shortDescription || 'Your short description will appear here.'}
          </p>
          {f.keywords.length > 0 && (
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {f.keywords.slice(0, 4).map((k) => (
                <span
                  key={k}
                  className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-4)] bg-[var(--color-violet-1)] text-[length:var(--font-size-13)]"
                >
                  {k}
                </span>
              ))}
              {f.keywords.length > 4 && (
                <span className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)]">
                  +{f.keywords.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: string;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-12)] bg-[var(--color-violet-1)] p-[var(--spacing-20)] flex flex-col gap-[var(--spacing-12)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
          <span aria-hidden className="mr-[var(--spacing-8)]">{icon}</span>
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          title={`Edit ${title}`}
          className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[var(--color-grey-white)] hover:bg-[var(--color-grey-1)]"
        >
          ✎
        </button>
      </div>
      {children}
    </div>
  );
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-8)] bg-[var(--color-grey-white)] p-[var(--spacing-16)]">
      <p className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] mb-[var(--spacing-4)]">{label}</p>
      <p className="text-[length:var(--font-size-15)] leading-[var(--line-height-150)] whitespace-pre-wrap text-[color:var(--color-grey-black)]">
        {value || '—'}
      </p>
    </div>
  );
}

function ChipsCard({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[var(--radius-8)] bg-[var(--color-grey-white)] p-[var(--spacing-16)]">
      <p className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] mb-[var(--spacing-8)]">{label}</p>
      {values.length === 0 ? (
        <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">—</p>
      ) : (
        <div className="flex flex-wrap gap-[var(--spacing-8)]">
          {values.map((v) => (
            <span
              key={v}
              className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-4)] bg-[var(--color-violet-1)] text-[length:var(--font-size-14)]"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
