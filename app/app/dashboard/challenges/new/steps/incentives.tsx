'use client';

import { useWizardDispatch, useWizardSelector } from '../store';
import { setField } from '../wizard-slice';
import { LIMITS } from '@/lib/wizard-shared';
import { StepHeading, TextArea } from '../controls';
import { ImprovableField } from '../improve';
import { Dropzone } from '../dropzone';

export function IncentivesStep() {
  const dispatch = useWizardDispatch();
  const f = useWizardSelector((s) => s.wizard.fields);

  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      <StepHeading num={3} title="Incentives & Supporting Data" />

      <ImprovableField
        target="rewardInformation"
        label="Incentives Information"
        required
        counter={{ len: f.rewardInformation.length, max: LIMITS.rewardInformation }}
      >
        <TextArea
          value={f.rewardInformation}
          maxLength={LIMITS.rewardInformation}
          placeholder="Describe the reward structure..."
          rows={5}
          onChange={(v) => dispatch(setField({ key: 'rewardInformation', value: v }))}
        />
      </ImprovableField>

      <Dropzone />
    </div>
  );
}
