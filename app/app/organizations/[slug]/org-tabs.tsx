'use client';

import { useState } from 'react';

/**
 * Overview / Challenges / Solutions tabs on the org page (captured:
 * auth-shots/organizations_digital.png). Content for every tab is server-rendered
 * and passed in; this only toggles visibility, so the page stays prerenderable.
 */

const ICONS: Record<string, React.ReactNode> = {
  Overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg>
  ),
  Challenges: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
  Solutions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.6-1 1.5-1 2.5h-6c0-1-.3-1.9-1-2.5A6 6 0 0 1 12 3z" /></svg>
  ),
};

export function OrgTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].label);
  return (
    <>
      <nav className="flex gap-[var(--spacing-8)] border-b border-solid border-[var(--color-grey-2)] mb-[var(--spacing-32)]">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setActive(t.label)}
            className="flex items-center gap-[var(--spacing-8)] px-[var(--spacing-24)] py-[var(--spacing-16)] text-[length:var(--font-size-16)] border-b-2 border-solid -mb-px"
            style={{
              borderColor: active === t.label ? 'var(--color-grey-black)' : 'transparent',
              fontWeight: active === t.label ? 600 : 400,
            }}
          >
            {ICONS[t.label]} {t.label}
          </button>
        ))}
      </nav>
      {tabs.map((t) => (
        <div key={t.label} hidden={active !== t.label}>
          {t.content}
        </div>
      ))}
    </>
  );
}
