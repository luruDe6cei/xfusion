'use client';

import { useWizardDispatch, useWizardSelector } from '../store';
import { setField } from '../wizard-slice';
import { DEPLOYMENT_OPTIONS, LIMITS, MAX_EXPERTISE } from '@/lib/wizard-shared';
import { ChipInput, MultiSelect, SelectBox, StepHeading, TextArea } from '../controls';
import { ImprovableField } from '../improve';

export function ObjectivesStep({ expertiseOptions }: { expertiseOptions: string[] }) {
  const dispatch = useWizardDispatch();
  const f = useWizardSelector((s) => s.wizard.fields);
  const chatLen = useWizardSelector((s) => s.wizard.chat.length);

  // Suggestion-style ✨ targets work off context, not the field's own value.
  const hasContext =
    chatLen > 0 || Boolean(f.shortDescription.trim() || f.objective.trim() || f.name.trim());

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

      <ImprovableField target="requiredExpertise" label="Required Expertise" required enabledWhen={hasContext}>
        <div className="flex flex-col gap-[var(--spacing-12)]">
          <MultiSelect
            values={f.requiredExpertise}
            options={expertiseOptions}
            placeholder="Select from list..."
            max={MAX_EXPERTISE}
            onChange={(v) => dispatch(setField({ key: 'requiredExpertise', value: v }))}
          />
          <ChipInput
            values={f.requiredExpertise}
            placeholder="Or enter custom expertise..."
            addLabel="Add Expertise"
            max={MAX_EXPERTISE}
            onChange={(v) => dispatch(setField({ key: 'requiredExpertise', value: v }))}
          />
        </div>
      </ImprovableField>

      <ImprovableField
        target="requiredDeploymentTime"
        label="Required Deployment Time"
        required
        enabledWhen={hasContext}
      >
        <SelectBox
          value={f.requiredDeploymentTime}
          placeholder="Select deployment timeframe"
          options={DEPLOYMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => dispatch(setField({ key: 'requiredDeploymentTime', value: v }))}
        />
      </ImprovableField>
    </div>
  );
}
