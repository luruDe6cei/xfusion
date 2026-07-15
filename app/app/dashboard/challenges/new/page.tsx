import { getExpertiseOptions, getIndustries, getSubIndustries } from '@/lib/data';
import { Wizard } from './wizard';

// XF2-13 / ADR-006 — the Challenge Wizard: the real site's 5-step create flow
// (Splash → Basic Information → Objectives & Requirements → Incentives &
// Supporting Data → AI Assistance → Review) with the AI chat as a sidebar dock.

export const metadata = { title: 'Create a New Challenge — xFUSION' };

export default async function NewChallengeWizardPage() {
  const [industries, subIndustries, expertiseOptions] = await Promise.all([
    getIndustries(),
    getSubIndustries(),
    getExpertiseOptions(),
  ]);
  return (
    <Wizard
      industries={industries.map((i) => i.name)}
      categories={subIndustries.map((s) => s.name)}
      expertiseOptions={expertiseOptions}
    />
  );
}
