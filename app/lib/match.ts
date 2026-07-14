// xFUSION 2.0 demo — internal solution-discovery engine (spec ch. 3 + ch. 9).
//
// The real product computes matches with an LLM pipeline we can't see
// (`averageMatchScore` is in the API, its logic isn't — see HANDOFF.md §3).
// This is a deliberately simple, fully deterministic stand-in: scores derive
// from keyword/expertise/industry overlap plus a stable hash of the pair's
// ids, so every build and reload ranks identically. Good enough to demo the
// "8 solutions + Why this Match + score breakdown" flow; not a real matcher.
import type { Challenge, Solution } from './types';

export interface MatchSubScores {
  relevance: number;
  novelty: number;
  businessPotential: number;
  crossIndustry: number;
}

/** Serializable card payload for the client panel — no Dates, no nesting. */
export interface SolutionMatch {
  slug: string;
  name: string;
  companyName: string;
  companyLogo?: string | null;
  industryName?: string | null;
  shortDescription?: string | null;
  timeToImplement?: string | null;
  score: number;
  subScores: MatchSubScores;
  reasons: string[];
}

const STOPWORDS = new Set(
  'the a an and or of to in for with on by from at as is are be this that our their its it using use used new more most other into can will'.split(' '),
);

function tokenize(...texts: Array<string | null | undefined>): Set<string> {
  const out = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const w of t.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 3 && !STOPWORDS.has(w)) out.add(w);
    }
  }
  return out;
}

/** FNV-1a → stable pseudo-random in [0, 1). Same pair, same score, forever. */
function hash01(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

const clamp = (n: number, lo = 25, hi = 97) => Math.round(Math.min(hi, Math.max(lo, n)));

function scorePair(c: Challenge, s: Solution): { subScores: MatchSubScores; score: number; reasons: string[] } {
  const cTerms = tokenize(c.name, c.shortDescription, c.objective, ...c.keywords, ...c.requiredExpertise);
  const sTerms = tokenize(s.name, s.shortDescription, s.implementationMethodology, ...s.keywords);

  const sKw = new Set(s.keywords.map((k) => k.toLowerCase()));
  const sharedKeywords = c.keywords.filter((k) => sKw.has(k.toLowerCase()));
  const expertiseHits = c.requiredExpertise.filter((e) =>
    [...tokenize(e)].some((t) => sTerms.has(t)),
  );
  let common = 0;
  for (const t of cTerms) if (sTerms.has(t)) common++;
  const overlap = common / Math.max(8, Math.min(cTerms.size, sTerms.size));

  const sameIndustry = !!c.industry && !!s.industry && c.industry.id === s.industry.id;
  const seed = `${c.id}:${s.id}`;

  const relevance = clamp(
    48 +
      36 * Math.min(1, overlap * 3 + sharedKeywords.length * 0.2 + expertiseHits.length * 0.15) +
      (sameIndustry ? 8 : 0) +
      8 * hash01(seed + ':r'),
  );
  const novelty = clamp(55 + 32 * hash01(seed + ':n') + (sameIndustry ? 0 : 6));
  const businessPotential = clamp(
    52 + 28 * hash01(seed + ':b') + (s.previousImplementations ? 10 : 0) + (s.estimatedCost ? 4 : 0),
  );
  const crossIndustry = sameIndustry
    ? clamp(30 + 28 * hash01(seed + ':x'))
    : clamp(56 + 28 * hash01(seed + ':x') + 30 * Math.min(1, overlap * 3));

  const score = Math.round(
    0.4 * relevance + 0.2 * novelty + 0.25 * businessPotential + 0.15 * crossIndustry,
  );

  const reasons: string[] = [];
  if (sharedKeywords.length)
    reasons.push(`Shares ${sharedKeywords.length === 1 ? 'a keyword' : `${sharedKeywords.length} keywords`} with the challenge: ${sharedKeywords.slice(0, 4).join(', ')}.`);
  if (expertiseHits.length)
    reasons.push(`Covers required expertise: ${expertiseHits.slice(0, 3).join(', ')}.`);
  if (sameIndustry && c.industry) reasons.push(`Operates in the same industry (${c.industry.name}).`);
  if (!sameIndustry && s.industry && c.industry)
    reasons.push(`Cross-industry angle: brings a ${s.industry.name} approach into ${c.industry.name}.`);
  if (s.previousImplementations) reasons.push('Has documented previous implementations, lowering adoption risk.');
  if (s.timeToImplement) reasons.push(`Estimated time to implement: ${s.timeToImplement.replaceAll('_', ' ').toLowerCase()}.`);
  if (!reasons.length)
    reasons.push('Semantic similarity between the challenge statement and the solution summary.');

  return { subScores: { relevance, novelty, businessPotential, crossIndustry }, score, reasons };
}

/** Spec ch. 3: “Immediately after publishing, display 8 solutions.” */
export function rankSolutions(challenge: Challenge, solutions: Solution[], take = 8): SolutionMatch[] {
  return solutions
    .filter((s) => s.company?.id !== challenge.company?.id)
    .map((s) => {
      const { subScores, score, reasons } = scorePair(challenge, s);
      return {
        slug: s.slug,
        name: s.name,
        companyName: s.company?.name ?? '',
        companyLogo: s.company?.logo?.thumbnailUrl || s.company?.logo?.url || null,
        industryName: s.industry?.name ?? null,
        shortDescription: s.shortDescription ?? null,
        timeToImplement: s.timeToImplement ?? null,
        score,
        subScores,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take);
}
