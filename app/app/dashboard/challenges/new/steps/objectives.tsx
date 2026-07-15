'use client';

import { useWizardDispatch, useWizardSelector } from '../store';
import { setField } from '../wizard-slice';
import { DEPLOYMENT_OPTIONS, LIMITS, MAX_EXPERTISE } from '@/lib/wizard-shared';
import { ChipInput, FieldShell, SelectBox, StepHeading, TextArea } from '../controls';
import { ImprovableField } from '../improve';

export function ObjectivesStep({ expertiseOptions }: { expertiseOptions: string[] }) {
  const dispatch = useWizardDispatch();
  const f = useWizardSelector((s) => s.wizard.fields);

  const addExpertise = (v: string) => {
    if (!v || f.requiredExpertise.includes(v) || f.requiredExpertise.length >= MAX_EXPERTISE) return;
    dispatch(setField({ key: 'requiredExpertise', value: [...f.requiredExpertise, v] }));
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      <StepHeading num={2} title="Objectives & Requirements" />

      <ImprovableField
        target="objective"
        label="Challenge Objective"
        required
        counter={{ len: f.objective.length, max: LIMITS.objective }}
      >
        <TextArea
          value={f.objective}
          maxLength={LIMITS.objective}
          placeholder={
            'What is the expected outcome if this challenge is solved?\n' +
            'Describe how success should look in practice — what should improve, change, or become possible after implementation.'
          }
          rows={6}
          onChange={(v) => dispatch(setField({ key: 'objective', value: v }))}
        />
      </ImprovableField>

      <FieldShell label="Required Expertise" required>
        <div className="flex flex-col gap-[var(--spacing-12)]">
          <SelectBox
            value=""
            placeholder="Select from list..."
            options={expertiseOptions
              .filter((e) => !f.requiredExpertise.includes(e))
              .map((e) => ({ value: e, label: e }))}
            onChange={addExpertise}
          />
          <ChipInput
            values={f.requiredExpertise}
            placeholder="Or enter custom expertise..."
            addLabel="Add Expertise"
            max={MAX_EXPERTISE}
            onChange={(v) => dispatch(setField({ key: 'requiredExpertise', value: v }))}
          />
        </div>
      </FieldShell>

      <FieldShell label="Required Deployment Time" required>
        <SelectBox
          value={f.requiredDeploymentTime}
          placeholder="Select deployment timeframe"
          options={DEPLOYMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => dispatch(setField({ key: 'requiredDeploymentTime', value: v }))}
        />
      </FieldShell>
    </div>
  );
}
