import { redirect } from 'next/navigation';

// The chat-only intake (XF2-03) was absorbed into the Challenge Wizard's Chat
// Dock (XF2-13, ADR-006). Old links and bookmarks land on the wizard.
export default function LegacyNewChallengePage() {
  redirect('/dashboard/challenges/new');
}
