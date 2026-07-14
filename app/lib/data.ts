// Data layer — now backed by Postgres via Prisma.
// The `include`s reproduce the nested shape the components expect
// (company.logo, industry, subIndustry), matching the original API responses.
import { prisma } from './prisma';
import type { Challenge, Solution, Company, Industry } from './types';

const challengeInclude = {
  company: { include: { logo: true, country: true } },
  industry: true,
  subIndustry: true,
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

// First write path in the app (2.0 AI intake, spec ch. 2). There is no auth yet,
// so AI-submitted challenges hang off a synthetic "Demo Organization" — swap for
// the session user's company once auth exists (roadmap XF2-01).
export async function createChallenge(input: {
  name: string;
  shortDescription: string;
  objective: string;
  rewardInformation: string;
  industryName: string;
  requiredDeploymentTime: string;
  keywords: string[];
  requiredExpertise: string[];
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
      requiredDeploymentTime: input.requiredDeploymentTime,
      keywords: input.keywords,
      requiredExpertise: input.requiredExpertise,
      status: 'PUBLISHED',
    },
    include: challengeInclude,
  });
  return row as unknown as Challenge;
}
