// Data layer — now backed by Postgres via Prisma.
// The `include`s reproduce the nested shape the components expect
// (company.logo, industry, subIndustry), matching the original API responses.
import { prisma } from './prisma';
import type { Challenge, Solution, Company, Industry } from './types';

const challengeInclude = {
  company: { include: { logo: true, country: true } },
  industry: true,
  subIndustry: true,
  files: true, // Supporting Documents (wizard uploads + seeded rows)
} as const;

const solutionInclude = {
  company: { include: { logo: true, country: true } },
  industry: true,
  subIndustry: true, // "Category" in the list filters
} as const;

export async function getChallenges(): Promise<Challenge[]> {
  const rows = await prisma.challenge.findMany({
    where: { status: 'PUBLISHED' },
    include: challengeInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Challenge[];
}

// Detail lookups filter PUBLISHED like the lists do — otherwise a DRAFT would be
// hidden from /challenges yet fully visible at its direct URL.
export async function getChallenge(slug: string): Promise<Challenge | null> {
  const row = await prisma.challenge.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: challengeInclude,
  });
  return row as unknown as Challenge | null;
}

export async function getSolutions(): Promise<Solution[]> {
  const rows = await prisma.solution.findMany({
    where: { status: 'PUBLISHED' },
    include: solutionInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Solution[];
}

export async function getSolution(slug: string): Promise<Solution | null> {
  const row = await prisma.solution.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: solutionInclude,
  });
  return row as unknown as Solution | null;
}

export async function getCompanies(): Promise<Company[]> {
  const rows = await prisma.company.findMany({
    include: { logo: true, country: true },
    orderBy: { name: 'asc' },
  });
  return rows as unknown as Company[];
}

export async function getCompany(slug: string): Promise<Company | null> {
  const row = await prisma.company.findUnique({
    where: { slug },
    include: { logo: true, country: true },
  });
  return row as unknown as Company | null;
}

export async function challengesByCompany(companyId: string): Promise<Challenge[]> {
  const rows = await prisma.challenge.findMany({
    where: { companyId, status: 'PUBLISHED' },
    include: challengeInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Challenge[];
}

export async function solutionsByCompany(companyId: string): Promise<Solution[]> {
  const rows = await prisma.solution.findMany({
    where: { companyId, status: 'PUBLISHED' },
    include: solutionInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Solution[];
}

// Local demo helper for the delete button on challenge pages. Seeded challenges
// come back with `npm run db:seed`; AI-published ones are gone for good.
export async function deleteChallenge(slug: string): Promise<void> {
  await prisma.challenge.delete({ where: { slug } });
}

export async function getIndustries(): Promise<Industry[]> {
  const rows = await prisma.industry.findMany({ orderBy: { name: 'asc' } });
  return rows as unknown as Industry[];
}

// "Category" in the wizard/list UIs (see CONTEXT.md).
export async function getSubIndustries(): Promise<Industry[]> {
  const rows = await prisma.subIndustry.findMany({ orderBy: { name: 'asc' } });
  return rows as unknown as Industry[];
}

// Distinct expertise areas across all challenges — feeds the wizard's
// multiselect expertise picker. Most-used first (there are ~700 distinct
// values; the common ones must surface before scrolling/filtering).
export async function getExpertiseOptions(): Promise<string[]> {
  const rows = await prisma.challenge.findMany({
    where: { status: 'PUBLISHED' },
    select: { requiredExpertise: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows)
    for (const e of r.requiredExpertise) {
      const v = e.trim();
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([v]) => v);
}

// First write path in the app (2.0 AI intake, spec ch. 2). There is no auth yet,
// so AI-submitted challenges hang off a synthetic "Demo Organization" — swap for
// the session user's company once auth exists (roadmap XF2-01).
export async function createChallenge(input: {
  name: string;
  shortDescription: string;
  objective: string;
  rewardInformation: string;
  industryName: string;
  subIndustryName?: string;
  requiredDeploymentTime: string;
  keywords: string[];
  requiredExpertise: string[];
  files?: { name: string; url: string; mimetype: string; size: number }[];
}): Promise<Challenge> {
  const company = await prisma.company.upsert({
    where: { slug: 'demo-organization' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      description: 'Demo organization for challenges submitted through the xFUSION 2.0 AI intake.',
      isApproved: true,
      isCompleted: true,
    },
  });
  const industry = await prisma.industry.findFirst({ where: { name: input.industryName } });
  const subIndustry = input.subIndustryName
    ? await prisma.subIndustry.findFirst({ where: { name: input.subIndustryName } })
    : null;

  const base =
    input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) ||
    'challenge';
  let slug = base;
  for (let n = 2; await prisma.challenge.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

  const row = await prisma.challenge.create({
    data: {
      companyId: company.id,
      name: input.name,
      slug,
      shortDescription: input.shortDescription,
      objective: input.objective,
      rewardInformation: input.rewardInformation,
      industryId: industry?.id,
      subIndustryId: subIndustry?.id,
      requiredDeploymentTime: input.requiredDeploymentTime,
      keywords: input.keywords,
      requiredExpertise: input.requiredExpertise,
      status: 'PUBLISHED',
      files: input.files?.length
        ? {
            create: input.files.map((f) => ({
              name: f.name,
              url: f.url,
              mimetype: f.mimetype,
              filesize: f.size,
              type: f.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            })),
          }
        : undefined,
    },
    include: challengeInclude,
  });
  return row as unknown as Challenge;
}
