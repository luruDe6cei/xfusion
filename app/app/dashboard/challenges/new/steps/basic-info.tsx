'use client';

import { useWizardDispatch, useWizardSelector } from '../store';
import { setField } from '../wizard-slice';
import { LIMITS, MAX_KEYWORDS } from '@/lib/wizard-shared';
import { ChipInput, FieldShell, SelectBox, StepHeading, TextArea, TextInput } from '../controls';
import { ImprovableField } from '../improve';

export function BasicInfoStep({
  industries,
  categories,
}: {
  industries: string[];
  categories: string[];
}) {
  const dispatch = useWizardDispatch();
  const f = useWizardSelector((s) => s.wizard.fields);

  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      <StepHeading num={1} title="Basic Information" />

      <ImprovableField target="name" label="Challenge name" required>
        <TextInput
          value={f.name}
          maxLength={LIMITS.name}
          placeholder="Write your challenge's name"
          onChange={(v) => dispatch(setField({ key: 'name', value: v }))}
        />
      </ImprovableField>

      <ImprovableField
        target="shortDescription"
        label="Short description"
        required
        counter={{ len: f.shortDescription.length, max: LIMITS.shortDescription }}
      >
        <TextArea
          value={f.shortDescription}
          maxLength={LIMITS.shortDescription}
          placeholder="Describe the challenge shortly"
          rows={6}
          onChange={(v) => dispatch(setField({ key: 'shortDescription', value: v }))}
        />
      </ImprovableField>

      <div className="grid gap-[var(--spacing-16)] md:grid-cols-2">
        <FieldShell label="Domain" required>
          <SelectBox
            value={f.industry}
            placeholder="Select domain"
            options={industries.map((i) => ({ value: i, label: i }))}
            onChange={(v) => dispatch(setField({ key: 'industry', value: v }))}
          />
        </FieldShell>
        <FieldShell label="Category">
          <SelectBox
            value={f.category}
            placeholder="Select category"
            options={categories.map((c) => ({ value: c, label: c }))}
            onChange={(v) => dispatch(setField({ key: 'category', value: v }))}
          />
        </FieldShell>
      </div>

      <ImprovableField target="keywords" label="Keywords" required>
        <ChipInput
          values={f.keywords}
          placeholder="Add a keyword..."
          addLabel="Add Keyword"
          max={MAX_KEYWORDS}
          onChange={(v) => dispatch(setField({ key: 'keywords', value: v }))}
        />
      </ImprovableField>
    </div>
  );
}
