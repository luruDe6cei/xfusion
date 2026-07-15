'use server';

import { revalidatePath } from 'next/cache';
import { createChallenge } from '@/lib/data';
import {
  DEPLOYMENT_OPTIONS,
  LIMITS,
  MAX_EXPERTISE,
  MAX_FILES,
  MAX_KEYWORDS,
  type WizardFields,
} from '@/lib/wizard-shared';

// A Server Action is a public HTTP endpoint — sanitize even though our own UI
// sends well-formed data. Strings are clamped, arrays capped, enums checked.
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : [])
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);

export async function publishWizardChallenge(fields: WizardFields): Promise<{ slug: string }> {
  const name = str(fields.name, LIMITS.name);
  if (!name) throw new Error('A challenge title is required.');

  // Only files that went through our own /api/upload may be attached — anything
  // else could smuggle an arbitrary external URL into the challenge page.
  const files = (Array.isArray(fields.files) ? fields.files : [])
    .filter(
      (f) =>
        f &&
        typeof f.url === 'string' &&
        f.url.startsWith('/uploads/') &&
        !f.url.includes('..') &&
        typeof f.name === 'string',
    )
    .slice(0, MAX_FILES)
    .map((f) => ({
      name: f.name.slice(0, 120),
      url: f.url,
      mimetype: typeof f.mimetype === 'string' ? f.mimetype.slice(0, 100) : 'application/octet-stream',
      size: typeof f.size === 'number' ? f.size : 0,
    }));

  const c = await createChallenge({
    name,
    shortDescription: str(fields.shortDescription, LIMITS.shortDescription),
    objective: str(fields.objective, LIMITS.objective),
    rewardInformation: str(fields.rewardInformation, LIMITS.rewardInformation),
    industryName: str(fields.industry, 80),
    subIndustryName: str(fields.category, 80) || undefined,
    requiredDeploymentTime: DEPLOYMENT_OPTIONS.some((o) => o.value === fields.requiredDeploymentTime)
      ? fields.requiredDeploymentTime
      : 'NO_TIMEFRAME',
    keywords: list(fields.keywords, MAX_KEYWORDS, 60),
    requiredExpertise: list(fields.requiredExpertise, MAX_EXPERTISE, 80),
    files,
  });

  // The landing page and /explore list challenges too — keep them fresh in
  // production builds, not just /challenges.
  revalidatePath('/challenges');
  revalidatePath('/explore');
  revalidatePath('/');
  return { slug: c.slug };
}
