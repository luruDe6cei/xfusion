import { getCompanies, challengesByCompany, solutionsByCompany } from '@/lib/data';
import { CompanyCard, SectionHeader } from '../components';

export default async function OrganizationsPage() {
  const all = await getCompanies();
  const companies = all.filter((c) => typeof c.slug === 'string' && c.slug.length > 0);
  const withCounts = await Promise.all(
    companies.map(async (c) => ({
      c,
      counts: {
        ch: (await challengesByCompany(c.id)).length,
        so: (await solutionsByCompany(c.id)).length,
      },
    })),
  );
  return (
    <div>
      <SectionHeader title={`Organizations (${companies.length})`} />
      <div className="grid-cards">
        {withCounts.map(({ c, counts }) => (
          <CompanyCard key={c.id} c={c} counts={counts} />
        ))}
      </div>
    </div>
  );
}
