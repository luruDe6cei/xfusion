import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import {
  initialWizardState,
  wizardReducer,
  type WizardState,
} from './wizard-slice';
import { EMPTY_FIELDS } from '@/lib/wizard-shared';

// Version the key so a future state-shape change doesn't crash old drafts —
// bump the suffix and stale drafts are simply ignored.
export const DRAFT_KEY = 'xfusion-wizard-draft-v1';

function loadDraft(): WizardState | undefined {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as Partial<WizardState>;
    // Deep-merge over the initial shape so missing keys never crash reducers.
    const state: WizardState = {
      ...initialWizardState,
      ...saved,
      fields: { ...EMPTY_FIELDS, ...(saved.fields ?? {}) },
      assist: { ...initialWizardState.assist, ...(saved.assist ?? {}) },
    };
    // Transient statuses must not survive a reload.
    if (state.assist.status === 'loading') state.assist.status = 'idle';
    return state;
  } catch {
    return undefined;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

// Client-only: the wizard root creates the store after mount, so localStorage
// is always available and SSR never sees draft state.
export function makeWizardStore() {
  const store = configureStore({
    reducer: { wizard: wizardReducer },
    preloadedState: loadDraft() ? { wizard: loadDraft()! } : undefined,
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    if (timer) return; // throttle: at most one write per 400ms
    timer = setTimeout(() => {
      timer = null;
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(store.getState().wizard));
      } catch {}
    }, 400);
  });

  return store;
}

export type WizardStore = ReturnType<typeof makeWizardStore>;
export type RootState = ReturnType<WizardStore['getState']>;
export type AppDispatch = WizardStore['dispatch'];

export const useWizardDispatch: () => AppDispatch = useDispatch;
export const useWizardSelector: TypedUseSelectorHook<RootState> = useSelector;
