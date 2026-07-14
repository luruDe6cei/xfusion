// Seeds Postgres from the scraped JSON in ../data.
// Run: npm run db:seed  (idempotent — uses upserts).
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const DATA = join(process.cwd(), 'data');
const load = (f: string) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

const countries = load('countries.json') as any[];
const industries = load('industries.json') as any[];
const companies = load('companies.json') as any[];
const challenges = load('challenges.json') as any[];
const solutions = load('solutions.json') as any[];

// De-dupe helper keyed by id.
function dedupe<T extends { id: string }>(rows: (T | null | undefined)[]): T[] {
  const m = new Map<string, T>();
  for (const r of rows) if (r?.id) m.set(r.id, r);
  return [...m.values()];
}

async function main() {
  console.log('Seeding…');

  // 1. Countries
  for (const c of countries) {
    await prisma.country.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name },
      update: { name: c.name },
    });
  }
  console.log(`  countries: ${countries.length}`);

  // 2. Industries
  for (const i of industries) {
    await prisma.industry.upsert({
      where: { id: i.id },
      create: { id: i.id, name: i.name, slug: i.slug },
      update: { name: i.name, slug: i.slug },
    });
  }
  console.log(`  industries: ${industries.length}`);

  // 3. Sub-industries — only present nested in challenges; parent = challenge.industryId
  const subs = dedupe(
    challenges
      .filter((c) => c.subIndustry)
      .map((c) => ({ ...c.subIndustry, industryId: c.industryId })),
  );
  const industryIds = new Set(industries.map((i) => i.id));
  for (const s of subs) {
    const industryId = industryIds.has(s.industryId) ? s.industryId : null;
    await prisma.subIndustry.upsert({
      where: { id: s.id },
      create: { id: s.id, name: s.name, slug: s.slug, industryId },
      update: { name: s.name, slug: s.slug, industryId },
    });
  }
  console.log(`  sub-industries: ${subs.length}`);

  // 4. Companies (from the companies list + any nested inside challenges/solutions)
  const allCompanies = dedupe([
    ...companies,
    ...challenges.map((c) => c.company),
    ...solutions.map((s) => s.company),
  ]);
  const countryIds = new Set(countries.map((c) => c.id));
  for (const co of allCompanies) {
    // Logo is a File; insert it first so the FK resolves.
    let logoId: string | null = null;
    if (co.logo?.id) {
      await upsertFile(co.logo);
      logoId = co.logo.id;
    }
    const countryId = countryIds.has(co.countryId) ? co.countryId : null;
    const base = {
      name: co.name,
      slug: co.slug ?? co.id, // 3 companies have null slugs upstream
      description: co.description ?? null,
      website: co.website ?? null,
      domain: co.domain ?? null,
      isApproved: !!co.isApproved,
      isCompleted: !!co.isCompleted,
      hasDeletionRequest: !!co.hasDeletionRequest,
      logoId,
      countryId,
      ownerId: co.ownerId ?? null,
    };
    await prisma.company.upsert({
      where: { id: co.id },
      create: { id: co.id, ...base },
      update: base,
    });
  }
  console.log(`  companies: ${allCompanies.length}`);

  // 5. Challenges
  for (const c of challenges) {
    const base = {
      companyId: c.companyId,
      createdByUserId: c.createdByUserId ?? null,
      name: c.name,
      slug: c.slug,
      shortDescription: c.shortDescription ?? null,
      description: c.description ?? null,
      objective: c.objective ?? null,
      industryId: industryIds.has(c.industryId) ? c.industryId : null,
      subIndustryId: c.subIndustryId ?? null,
      keywords: c.keywords ?? [],
      requiredExpertise: c.requiredExpertise ?? [],
      requiredDeploymentTime: c.requiredDeploymentTime ?? null,
      rewardInformation: c.rewardInformation ?? null,
      status: c.status ?? 'PUBLISHED',
      viewsCount: c.viewsCount ?? 0,
      sharesCount: c.sharesCount ?? 0,
      averageMatchScore: c.averageMatchScore ?? null,
      showOnHomepage: !!c.showOnHomepage,
      homepageOrder: c.homepageOrder ?? 0,
      countryId: c.countryId ?? null,
    };
    await prisma.challenge.upsert({ where: { id: c.id }, create: { id: c.id, ...base }, update: base });
    for (const f of c.files ?? []) await upsertFile(f, { challengeId: c.id });
  }
  console.log(`  challenges: ${challenges.length}`);

  // 6. Solutions
  for (const s of solutions) {
    const base = {
      companyId: s.companyId ?? s.company?.id,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription ?? null,
      description: s.description ?? null,
      industryId: industryIds.has(s.industryId) ? s.industryId : null,
      keywords: s.keywords ?? [],
      status: s.status ?? 'PUBLISHED',
      viewsCount: s.viewsCount ?? 0,
    };
    await prisma.solution.upsert({ where: { id: s.id }, create: { id: s.id, ...base }, update: base });
    for (const f of s.files ?? []) await upsertFile(f, { solutionId: s.id });
  }
  console.log(`  solutions: ${solutions.length}`);

  console.log('Done.');
}

async function upsertFile(f: any, rel: { challengeId?: string; solutionId?: string } = {}) {
  const base = {
    name: f.name ?? 'file',
    url: f.url,
    key: f.key ?? null,
    thumbnailUrl: f.thumbnailUrl ?? null,
    type: f.type ?? null,
    mimetype: f.mimetype ?? null,
    filesize: f.filesize ?? null,
    width: f.width ?? null,
    height: f.height ?? null,
    format: f.format ?? null,
    isPrivate: !!f.isPrivate,
    ...rel,
  };
  await prisma.file.upsert({ where: { id: f.id }, create: { id: f.id, ...base }, update: base });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
