// Data layer — now backed by Postgres via Prisma.
// The `include`s reproduce the nested shape the components expect
// (company.logo, industry, subIndustry), matching the original API responses.
import { prisma } from './prisma';
import type { Challenge, Solution, Company } from './types';

const challengeInclude = {
  company: { include: { logo: true, country: true } },
  industry: true,
  subIndustry: true,
} as const;

const solutionInclude = {
  company: { include: { logo: true, country: true } },
  industry: true,
} as const;

export async function getChallenges(): Promise<Challenge[]> {
  const rows = await prisma.challenge.findMany({
    where: { status: 'PUBLISHED' },
    include: challengeInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Challenge[];
}

export async function getChallenge(slug: string): Promise<Challenge | null> {
  const row = await prisma.challenge.findUnique({ where: { slug }, include: challengeInclude });
  return row as unknown as Challenge | null;
}

export async function getSolutions(): Promise<Solution[]> {
  const rows = await prisma.solution.findMany({
    include: solutionInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Solution[];
}

export async function getSolution(slug: string): Promise<Solution | null> {
  const row = await prisma.solution.findUnique({ where: { slug }, include: solutionInclude });
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
    where: { companyId },
    include: solutionInclude,
    orderBy: { createdAt: 'desc' },
  });
  return rows as unknown as Solution[];
}
