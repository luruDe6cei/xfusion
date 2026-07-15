'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearDraft, useWizardDispatch, useWizardSelector } from './store';
import { canPublish, goToStep, isStepComplete, resetWizard } from './wizard-slice';
import { publishWizardChallenge } from './actions';

export function WizardFooter() {
  const router = useRouter();
  const dispatch = useWizardDispatch();
  const state = useWizardSelector((s) => s.wizard);
  const step = state.step;

  const [publishing, setPublishing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextDisabled = step <= 3 && !isStepComplete(state, step);

  const publish = async () => {
    if (publishing || !canPublish(state)) return;
    setPublishing(true);
    setError(null);
    try {
      const { slug } = await publishWizardChallenge(state.fields);
      clearDraft();
      dispatch(resetWizard());
      router.push(`/challenges/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publishing failed');
      setPublishing(false);
    }
  };

  // The Draft autosaves on every change — this button just makes that visible.
  const saveDraft = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  return (
    <footer className="flex flex-col gap-[var(--spacing-8)]">
      {error && (
        <div
          className="px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-8)] text-[length:var(--font-size-14)]"
          style={{ background: 'var(--gradient-error-card)', color: 'var(--color-grey-black)' }}
        >
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-[var(--spacing-16)] flex-wrap">
        <button
          type="button"
          onClick={() => dispatch(goToStep(step - 1))}
          disabled={step === 1}
          className="w-[240px] h-[52px] rounded-[var(--radius-40)] bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-black)] flex items-center px-[var(--spacing-24)] gap-[var(--spacing-12)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-grey-1)]"
        >
          <span aria-hidden>‹</span>
          <span className="flex-1 text-center">Back</span>
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={() => dispatch(goToStep(step + 1))}
            disabled={nextDisabled}
            className="w-[240px] h-[52px] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] hover:bg-[#333] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)] flex items-center px-[var(--spacing-24)] gap-[var(--spacing-12)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="flex-1 text-center">Next Step</span>
            <span aria-hidden>›</span>
          </button>
        ) : (
          <div className="flex items-center gap-[var(--spacing-16)] flex-wrap">
            <button
              type="button"
              onClick={saveDraft}
              className="h-[52px] px-[var(--spacing-32)] rounded-[var(--radius-40)] bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-black)] hover:bg-[var(--color-grey-1)]"
            >
              {savedFlash ? 'Saved on this device ✓' : 'Save as a Draft'}
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || !canPublish(state)}
              className="h-[52px] px-[var(--spacing-40)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] hover:bg-[#333] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)] flex items-center gap-[var(--spacing-12)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {publishing ? 'Publishing…' : 'Publish'}
              {!publishing && <span aria-hidden>›</span>}
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
