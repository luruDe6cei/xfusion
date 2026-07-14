'use server';

import { revalidatePath } from 'next/cache';
import { createChallenge } from '@/lib/data';
import { DEPLOYMENT_OPTIONS, LIMITS, type ChallengeFields } from './intake-shared';

// A Server Action is a public HTTP endpoint — sanitize even though our own UI
// sends well-formed data. Strings are clamped, arrays capped, enums checked.
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : [])
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);

export async function publishChallenge(fields: ChallengeFields): Promise<{ slug: string }> {
  const name = str(fields.name, LIMITS.name);
  if (!name) throw new Error('A challenge title is required.');

  const c = await createChallenge({
    name,
    shortDescription: str(fields.shortDescription, LIMITS.shortDescription),
    objective: str(fields.objective, 4000),
    rewardInformation: str(fields.rewardInformation, 2000),
    industryName: str(fields.industry, 80),
    requiredDeploymentTime: (DEPLOYMENT_OPTIONS as readonly string[]).includes(
      fields.requiredDeploymentTime,
    )
      ? fields.requiredDeploymentTime
      : 'NO_TIMEFRAME',
    keywords: list(fields.keywords, 15, 60),
    requiredExpertise: list(fields.requiredExpertise, 10, 80),
  });

  // The landing page and /explore list challenges too — keep them fresh in
  // production builds, not just /challenges.
  revalidatePath('/challenges');
  revalidatePath('/explore');
  revalidatePath('/');
  return { slug: c.slug };
}
