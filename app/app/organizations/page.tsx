import { getCompanies } from '@/lib/data';
import { HeroBanner, FilterableList } from '../list-chrome';

export default async function OrganizationsPage() {
  const all = await getCompanies();
  // 3 companies have null slugs upstream — they'd 404 on click.
  const companies = all.filter((c) => typeof c.slug === 'string' && c.slug.length > 0);

  return (
    <>
      <HeroBanner title="Organizations" variant="organizations" />
      {/* Upstream gives this page a search box and no filter row. */}
      <FilterableList items={companies} kind="organizations" />
    </>
  );
}
