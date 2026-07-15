// Shared between the Challenge Wizard (client), its API routes and the publish
// Server Action. Supersedes app/challenges/new/intake-shared.ts (XF2-13, ADR-006).

export const FIRST_QUESTION =
  "Let's shape your challenge together. What is the main pain point or challenge " +
  'you are experiencing day to day — and which solutions have you already tried?';

// Limits observed on the live wizard (captured 2026-07-15): shortDescription 1300,
// objective 1200, incentives 650. Name 90 comes from the public API data.
export const LIMITS = {
  name: 90,
  shortDescription: 1300,
  objective: 1200,
  rewardInformation: 650,
} as const;

export const MAX_KEYWORDS = 15;
export const MAX_EXPERTISE = 10;
export const MAX_FILES = 10;
export const MAX_FILE_MB = 10;

// Values observed in the real API data (challenges.json), labels from the live wizard.
export const DEPLOYMENT_OPTIONS = [
  { value: 'UP_TO_3_MONTHS', label: 'Up to 3 months' },
  { value: 'THREE_TO_6_MONTHS', label: '3–6 months' },
  { value: 'SIX_TO_12_MONTHS', label: '6–12 months' },
  { value: 'ONE_YEAR_PLUS', label: '1 year +' },
  { value: 'NO_TIMEFRAME', label: 'No timeframe' },
] as const;

export interface UploadedFile {
  name: string;
  url: string;
  mimetype: string;
  size: number;
}

// Everything the wizard collects. `industry` is the UI "Domain", `category` the
// UI "Category" (SubIndustry) — see CONTEXT.md.
export interface WizardFields {
  name: string;
  shortDescription: string;
  industry: string;
  category: string;
  keywords: string[];
  objective: string;
  requiredExpertise: string[];
  requiredDeploymentTime: string;
  rewardInformation: string;
  files: UploadedFile[];
}

export const EMPTY_FIELDS: WizardFields = {
  name: '',
  shortDescription: '',
  industry: '',
  category: '',
  keywords: [],
  objective: '',
  requiredExpertise: [],
  requiredDeploymentTime: '',
  rewardInformation: '',
  files: [],
};

// Field keys the AI (chat dock / improve routes) may propose values for.
export type AiFieldKey =
  | 'name'
  | 'shortDescription'
  | 'industry'
  | 'category'
  | 'keywords'
  | 'objective'
  | 'requiredExpertise'
  | 'requiredDeploymentTime'
  | 'rewardInformation';

export type FieldUpdates = Partial<
  Pick<WizardFields, AiFieldKey>
>;

export interface ChatMsg {
  role: 'user' | 'model';
  text: string;
  // Suggestions for touched fields that were NOT auto-applied — rendered as
  // "Apply" chips on this message. Auto-applied updates don't appear here.
  pending?: FieldUpdates;
}

// --- API contracts ---

// POST /api/challenge-intake
export interface IntakeRequest {
  messages: { role: 'user' | 'model'; text: string }[];
  fields: WizardFields;
  touched: AiFieldKey[];
  step: number;
}
export interface IntakeResponse {
  reply: string;
  fieldUpdates?: FieldUpdates | null;
  error?: string;
}

// POST /api/field-improve — target is a single field, or 'assist' for step 4.
export interface ImproveRequest {
  fields: WizardFields;
  transcript?: { role: 'user' | 'model'; text: string }[];
  target: AiFieldKey | 'assist';
}
export interface ImproveResponse {
  // single-field target
  improved?: string | string[];
  // target === 'assist'
  suggestions?: {
    objective: string;
    keywords: string[];
    requiredExpertise: string[];
  };
  error?: string;
}

// POST /api/wizard-tips
export interface TipsRequest {
  step: number;
  fields: WizardFields;
  transcript?: { role: 'user' | 'model'; text: string }[];
}
export interface TipsResponse {
  tips: string[];
  error?: string;
}

export const STEPS = [
  'Basic Information',
  'Objectives',
  'Incentives & Supporting Data',
  'AI Assistance',
  'Review',
] as const;

// Static per-step tips, lifted from the live wizard captures. Shown until (or
// instead of) AI-generated tips.
export const STATIC_TIPS: Record<number, string[]> = {
  1: [
    "Not sure about the title? Start with the description. AI can suggest a clear, relevant title once the challenge is defined.",
    'Describe the need, not the solution. Clear problem statements attract more relevant and unexpected solutions.',
    'Write for someone outside your industry. Simple, clear language enables cross-industry matching.',
  ],
  2: [
    'Describe the outcome, not the solution. Focus on what should change once the challenge is successfully addressed. Use measurable KPIs.',
    'Explain how success looks in the real world. What improvement or result would indicate success?',
    'Avoid technical or implementation details. Leave room for creative, cross-industry approaches.',
  ],
  3: ['Be clear about the type of incentive or engagement model offered.'],
  4: ['Use the AI tool to refine objectives, keywords, and expertise areas for more accurate matches.'],
  5: ['Review every section — you can jump back and edit anything before publishing.'],
};
