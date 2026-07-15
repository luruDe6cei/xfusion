'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { clearDraft, makeWizardStore, useWizardDispatch, useWizardSelector, type WizardStore } from './store';
import { dismissSplash, goToStep, isStepComplete, resetWizard, stepStatus } from './wizard-slice';
import { STEPS } from '@/lib/wizard-shared';
import { Splash, SKIP_SPLASH_KEY } from './splash';
import { WizardSidebar } from './sidebar';
import { WizardFooter } from './footer';
import { BasicInfoStep } from './steps/basic-info';
import { ObjectivesStep } from './steps/objectives';
import { IncentivesStep } from './steps/incentives';
import { AiAssistanceStep } from './steps/ai-assistance';
import { ReviewStep } from './steps/review';

export interface WizardData {
  industries: string[];
  categories: string[];
  expertiseOptions: string[];
}

// Client root. The store is created after mount so localStorage (the Draft)
// is read exactly once, on the client — SSR and hydration render the same
// placeholder and there is never a mismatch.
export function Wizard(data: WizardData) {
  const [store, setStore] = useState<WizardStore | null>(null);
  useEffect(() => setStore(makeWizardStore()), []);
  if (!store) {
    return (
      <div className="py-[80px] text-center text-[color:var(--color-grey-5)]">Loading…</div>
    );
  }
  return (
    <Provider store={store}>
      <WizardInner {...data} />
    </Provider>
  );
}

function WizardInner(data: WizardData) {
  const dispatch = useWizardDispatch();
  const splashDismissed = useWizardSelector((s) => s.wizard.splashDismissed);
  const step = useWizardSelector((s) => s.wizard.step);

  // "Don't show me again" is remembered independently of the Draft.
  useEffect(() => {
    if (!splashDismissed && localStorage.getItem(SKIP_SPLASH_KEY)) dispatch(dismissSplash());
  }, [splashDismissed, dispatch]);

  if (!splashDismissed) return <Splash />;

  const startOver = () => {
    if (
      !window.confirm(
        'Start over? This clears the draft saved on this device — all fields, the conversation and the attachments list.',
      )
    )
      return;
    clearDraft();
    dispatch(resetWizard());
  };

  return (
    <div className="py-[var(--spacing-32)] flex flex-col gap-[var(--spacing-24)]">
      <header className="flex items-start justify-between gap-[var(--spacing-24)] flex-wrap">
        <div className="flex flex-col gap-[var(--spacing-4)]">
          <h1 className="text-[length:var(--font-size-32)] font-[var(--font-weight-bold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
            {step === 5 ? 'Preview & Save' : 'Create a New Challenge'}
          </h1>
          <button
            type="button"
            onClick={startOver}
            title="Clears the draft saved on this device"
            className="self-start text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] hover:text-[color:var(--color-error)] hover:underline"
          >
            ↺ Start over
          </button>
        </div>
        <Stepper />
      </header>

      <div className="grid gap-[var(--spacing-24)] items-stretch lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="bg-[var(--color-grey-white)] rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-2)] p-[var(--spacing-32)] min-h-[520px]">
          {step === 1 && <BasicInfoStep industries={data.industries} categories={data.categories} />}
          {step === 2 && <ObjectivesStep expertiseOptions={data.expertiseOptions} />}
          {step === 3 && <IncentivesStep />}
          {step === 4 && <AiAssistanceStep />}
          {step === 5 && <ReviewStep />}
        </section>
        <WizardSidebar />
      </div>

      <WizardFooter />
    </div>
  );
}

function Stepper() {
  const dispatch = useWizardDispatch();
  const state = useWizardSelector((s) => s.wizard);
  const current = state.step;

  // A step is reachable by click if it's before the current one, or if every
  // step preceding it is complete (so you can't jump into an invalid future).
  const reachable = (n: number) => {
    if (n <= current) return true;
    for (let i = 1; i < n; i++) if (i !== 4 && !isStepComplete(state, i)) return false;
    return true;
  };

  return (
    <ol className="flex items-start">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const status = stepStatus(state, n);
        const done = status === 'complete' && n !== current;
        const active = n === current;
        return (
          <li key={label} className="flex items-start">
            {i > 0 && (
              <span
                aria-hidden
                className="mt-[15px] h-px w-[38px] xl:w-[64px]"
                style={{ background: done || n <= current ? 'var(--color-green-1)' : 'var(--color-grey-3)' }}
              />
            )}
            <button
              type="button"
              onClick={() => reachable(n) && dispatch(goToStep(n))}
              disabled={!reachable(n)}
              className="flex flex-col items-center gap-[var(--spacing-8)] w-[92px] xl:w-[110px] disabled:cursor-not-allowed"
            >
              <span
                className="flex items-center justify-center w-[32px] h-[32px] rounded-full text-[length:var(--font-size-14)]"
                style={
                  done
                    ? { background: 'var(--color-green-1)', color: 'var(--color-grey-white)' }
                    : active
                      ? { background: 'var(--color-violet-6)', color: 'var(--color-grey-white)' }
                      : { background: 'var(--color-violet-1)', color: 'var(--color-grey-5)' }
                }
              >
                {done ? <CheckIcon /> : String(n).padStart(2, '0')}
              </span>
              <span
                className="text-[length:var(--font-size-13)] leading-[var(--line-height-120)] text-center"
                style={{ color: active ? 'var(--color-grey-black)' : 'var(--color-grey-5)' }}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
