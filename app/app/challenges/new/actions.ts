'use server';

import { revalidatePath } from 'next/cache';
import { createChallenge } from '@/lib/data';
import { LIMITS, type ChallengeFields } from './intake-shared';

export async function publishChallenge(fields: ChallengeFields): Promise<{ slug: string }> {
  const c = await createChallenge({
    name: fields.name.slice(0, LIMITS.name),
    shortDescription: fields.shortDescription.slice(0, LIMITS.shortDescription),
    objective: fields.objective,
    rewardInformation: fields.rewardInformation,
    industryName: fields.industry,
    requiredDeploymentTime: fields.requiredDeploymentTime,
    keywords: fields.keywords.map((k) => k.trim()).filter(Boolean),
    requiredExpertise: fields.requiredExpertise.map((e) => e.trim()).filter(Boolean),
  });
  revalidatePath('/challenges');
  return { slug: c.slug };
}
