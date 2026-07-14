// Shared between the intake chat (client), the API route and the server action.

export const FIRST_QUESTION =
  "Let's shape your challenge together. What is the main pain point or challenge " +
  'you are experiencing day to day — and which solutions have you already tried?';

export const LIMITS = { name: 90, shortDescription: 1500 } as const;

// Values observed in the real API data (challenges.json).
export const DEPLOYMENT_OPTIONS = [
  'UP_TO_3_MONTHS',
  'THREE_TO_6_MONTHS',
  'SIX_TO_12_MONTHS',
  'ONE_YEAR_PLUS',
  'NO_TIMEFRAME',
] as const;

export interface ChallengeFields {
  name: string;
  shortDescription: string;
  objective: string;
  rewardInformation: string;
  industry: string;
  requiredDeploymentTime: string;
  keywords: string[];
  requiredExpertise: string[];
}

export interface IntakeResponse {
  reply: string;
  done: boolean;
  fields?: ChallengeFields | null;
  error?: string;
}
