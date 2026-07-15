import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  EMPTY_FIELDS,
  type AiFieldKey,
  type ChatMsg,
  type FieldUpdates,
  type UploadedFile,
  type WizardFields,
} from '@/lib/wizard-shared';

// The Challenge Wizard state machine (ADR-006). One slice holds everything the
// steps, stepper, chat dock, ✨ buttons and tips share: step position, field
// values, which fields the user has touched, the chat transcript and caches.

export interface AssistSuggestions {
  objective: string;
  keywords: string[];
  requiredExpertise: string[];
}

export interface WizardState {
  splashDismissed: boolean;
  step: number; // 1..5
  fields: WizardFields;
  // Fields the user edited by hand (or accepted explicitly). The chat dock may
  // only auto-fill fields that are NOT in this list — never overwrite user input.
  touched: AiFieldKey[];
  chat: ChatMsg[];
  // AI tips per step, keyed by a hash of the context they were generated from.
  tips: Record<number, { hash: string; tips: string[] }>;
  // Step 4 "Help Me Write" (three suggestion sections, per the live capture).
  assist: {
    status: 'idle' | 'loading' | 'done' | 'error';
    suggestions: AssistSuggestions | null;
    accepted: { objective: boolean; keywords: boolean; requiredExpertise: boolean };
    error: string | null;
  };
}

export const initialWizardState: WizardState = {
  splashDismissed: false,
  step: 1,
  fields: EMPTY_FIELDS,
  touched: [],
  chat: [],
  tips: {},
  assist: { status: 'idle', suggestions: null, accepted: { objective: false, keywords: false, requiredExpertise: false }, error: null },
};

const touch = (state: WizardState, key: AiFieldKey) => {
  if (!state.touched.includes(key)) state.touched.push(key);
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState: initialWizardState,
  reducers: {
    dismissSplash(state) {
      state.splashDismissed = true;
    },
    goToStep(state, action: PayloadAction<number>) {
      state.step = Math.min(5, Math.max(1, action.payload));
    },
    // User typed into a field — set it and mark it touched.
    setField(
      state,
      action: PayloadAction<{ key: AiFieldKey; value: string | string[] }>,
    ) {
      const { key, value } = action.payload;
      (state.fields as Record<AiFieldKey, string | string[]>)[key] = value;
      touch(state, key);
    },
    addFiles(state, action: PayloadAction<UploadedFile[]>) {
      state.fields.files.push(...action.payload);
    },
    removeFile(state, action: PayloadAction<string>) {
      state.fields.files = state.fields.files.filter((f) => f.url !== action.payload);
    },
    chatUserMessage(state, action: PayloadAction<string>) {
      state.chat.push({ role: 'user', text: action.payload });
    },
    // A chat reply arrived: auto-apply updates to untouched fields; keep the
    // rest as pending "Apply" chips on the message (ADR-006 merge rule).
    chatModelReply(
      state,
      action: PayloadAction<{ reply: string; fieldUpdates?: FieldUpdates | null }>,
    ) {
      const { reply, fieldUpdates } = action.payload;
      const pending: FieldUpdates = {};
      if (fieldUpdates) {
        for (const [k, v] of Object.entries(fieldUpdates) as [
          AiFieldKey,
          string | string[],
        ][]) {
          if (v === undefined || v === null) continue;
          if (state.touched.includes(k)) {
            (pending as Record<string, unknown>)[k] = v;
          } else {
            (state.fields as Record<AiFieldKey, string | string[]>)[k] = v;
          }
        }
      }
      state.chat.push({
        role: 'model',
        text: reply,
        pending: Object.keys(pending).length ? pending : undefined,
      });
    },
    // User clicked an "Apply" chip on a chat message.
    applyPending(state, action: PayloadAction<{ msgIndex: number; key: AiFieldKey }>) {
      const { msgIndex, key } = action.payload;
      const msg = state.chat[msgIndex];
      const value = msg?.pending?.[key];
      if (value === undefined) return;
      (state.fields as Record<AiFieldKey, string | string[]>)[key] = value as string | string[];
      touch(state, key);
      delete msg.pending![key];
      if (Object.keys(msg.pending!).length === 0) msg.pending = undefined;
    },
    setTips(state, action: PayloadAction<{ step: number; hash: string; tips: string[] }>) {
      const { step, hash, tips } = action.payload;
      state.tips[step] = { hash, tips };
    },
    assistStart(state) {
      state.assist.status = 'loading';
      state.assist.error = null;
    },
    assistDone(state, action: PayloadAction<AssistSuggestions>) {
      state.assist.status = 'done';
      state.assist.suggestions = action.payload;
      state.assist.accepted = { objective: false, keywords: false, requiredExpertise: false };
    },
    assistError(state, action: PayloadAction<string>) {
      state.assist.status = 'error';
      state.assist.error = action.payload;
    },
    // Accept one suggestion section (keywords/expertise merge with existing values).
    assistAccept(state, action: PayloadAction<'objective' | 'keywords' | 'requiredExpertise'>) {
      const s = state.assist.suggestions;
      if (!s) return;
      const key = action.payload;
      if (key === 'objective') {
        state.fields.objective = s.objective;
      } else {
        const merged = [...state.fields[key]];
        for (const v of s[key]) if (!merged.includes(v)) merged.push(v);
        state.fields[key] = merged;
      }
      touch(state, key);
      state.assist.accepted[key] = true;
    },
    resetWizard() {
      return initialWizardState;
    },
  },
});

export const {
  dismissSplash,
  goToStep,
  setField,
  addFiles,
  removeFile,
  chatUserMessage,
  chatModelReply,
  applyPending,
  setTips,
  assistStart,
  assistDone,
  assistError,
  assistAccept,
  resetWizard,
} = wizardSlice.actions;

export const wizardReducer = wizardSlice.reducer;

// --- selectors ---

export const isStepComplete = (state: WizardState, step: number): boolean => {
  const f = state.fields;
  switch (step) {
    case 1:
      return Boolean(f.name.trim() && f.shortDescription.trim() && f.industry && f.keywords.length);
    case 2:
      return Boolean(f.objective.trim() && f.requiredExpertise.length && f.requiredDeploymentTime);
    case 3:
      return Boolean(f.rewardInformation.trim());
    case 4:
      return true; // optional step
    case 5:
      return isStepComplete(state, 1) && isStepComplete(state, 2) && isStepComplete(state, 3);
    default:
      return false;
  }
};

const stepFieldKeys: Record<number, AiFieldKey[]> = {
  1: ['name', 'shortDescription', 'industry', 'category', 'keywords'],
  2: ['objective', 'requiredExpertise', 'requiredDeploymentTime'],
  3: ['rewardInformation'],
};

export type StepStatus = 'untouched' | 'in-progress' | 'complete';

export const stepStatus = (state: WizardState, step: number): StepStatus => {
  if (isStepComplete(state, step) && step !== 4 && step !== 5) return 'complete';
  const keys = stepFieldKeys[step] ?? [];
  const hasContent = keys.some((k) => {
    const v = state.fields[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
  });
  if (step === 4) return state.assist.status === 'done' ? 'complete' : 'untouched';
  if (step === 5) return isStepComplete(state, 5) ? 'complete' : 'untouched';
  return hasContent ? 'in-progress' : 'untouched';
};

export const canPublish = (state: WizardState): boolean => isStepComplete(state, 5);
