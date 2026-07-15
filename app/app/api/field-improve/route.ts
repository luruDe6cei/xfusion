// ✨ Improve Buttons + step-4 "Help Me Write" (XF2-13, ADR-006).
// One route, two modes:
//  - target = a single field key → rewrite that field within its scope,
//    returned as { improved } for the preview → Accept/Reject UI.
//  - target = 'assist' → the step-4 pass: { suggestions: { objective,
//    keywords, requiredExpertise } } (three sections, per the live capture).
import { NextResponse } from 'next/server';
import { geminiJson, type ChatTurn } from '@/lib/gemini';
import {
  EMPTY_FIELDS,
  LIMITS,
  MAX_EXPERTISE,
  MAX_KEYWORDS,
  type ImproveRequest,
  type ImproveResponse,
  type WizardFields,
} from '@/lib/wizard-shared';

const MAX_TRANSCRIPT_CHARS = 20_000;

const IMPROVABLE = ['name', 'shortDescription', 'keywords', 'objective', 'rewardInformation'] as const;
type Improvable = (typeof IMPROVABLE)[number];

const FIELD_BRIEFS: Record<Improvable, string> = {
  name: `Rewrite the challenge title: punchy, specific, max ${LIMITS.name} characters, no trailing period. Return a single title, nothing else.`,
  shortDescription: `Rewrite the challenge statement: max ${LIMITS.shortDescription} characters, 2–4 short paragraphs from the organization's perspective ("We ..."): context and pain, what has been tried, what is sought. Keep the user's own facts and numbers; sharpen the language; write for readers outside their industry.`,
  objective: `Rewrite the challenge objective: 3–5 bullets, each on its own line starting with "• ", each short and measurable (a KPI where possible). Max ${LIMITS.objective} characters. Describe outcomes, not solutions.`,
  rewardInformation: `Rewrite the incentives description: 1–3 sentences describing the partnership/engagement model offered (joint development, POC, paid pilot, prize...). Max ${LIMITS.rewardInformation} characters. Be concrete about what a solver gets.`,
  keywords: `Suggest ADDITIONAL search keywords for this challenge: 6–10 lowercase phrases, cross-industry angles included, none duplicating the existing keywords. Think beyond the obvious industry boundary.`,
};

const STRING_SCHEMA = {
  type: 'OBJECT',
  properties: { improved: { type: 'STRING' } },
  required: ['improved'],
} as const;

const ARRAY_SCHEMA = {
  type: 'OBJECT',
  properties: { improved: { type: 'ARRAY', items: { type: 'STRING' } } },
  required: ['improved'],
} as const;

const ASSIST_SCHEMA = {
  type: 'OBJECT',
  properties: {
    objective: { type: 'STRING' },
    keywords: { type: 'ARRAY', items: { type: 'STRING' } },
    requiredExpertise: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['objective', 'keywords', 'requiredExpertise'],
} as const;

function clampFields(raw: unknown): WizardFields {
  const f = { ...EMPTY_FIELDS, ...(typeof raw === 'object' && raw ? raw : {}) } as WizardFields;
  return {
    ...EMPTY_FIELDS,
    name: String(f.name ?? '').slice(0, LIMITS.name),
    shortDescription: String(f.shortDescription ?? '').slice(0, LIMITS.shortDescription),
    industry: String(f.industry ?? '').slice(0, 80),
    category: String(f.category ?? '').slice(0, 80),
    objective: String(f.objective ?? '').slice(0, LIMITS.objective),
    rewardInformation: String(f.rewardInformation ?? '').slice(0, LIMITS.rewardInformation),
    requiredDeploymentTime: String(f.requiredDeploymentTime ?? '').slice(0, 40),
    keywords: Array.isArray(f.keywords) ? f.keywords.slice(0, MAX_KEYWORDS).map(String) : [],
    requiredExpertise: Array.isArray(f.requiredExpertise)
      ? f.requiredExpertise.slice(0, MAX_EXPERTISE).map(String)
      : [],
  };
}

function contextBlock(fields: WizardFields, transcript: ChatTurn[]): string {
  const form = JSON.stringify({
    name: fields.name,
    shortDescription: fields.shortDescription,
    industry: fields.industry,
    category: fields.category,
    keywords: fields.keywords,
    objective: fields.objective,
    requiredExpertise: fields.requiredExpertise,
    requiredDeploymentTime: fields.requiredDeploymentTime,
    rewardInformation: fields.rewardInformation,
  });
  const chat = transcript.length
    ? transcript.map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')
    : '(no conversation yet)';
  return `CURRENT FORM STATE\n${form}\n\nINTAKE CONVERSATION SO FAR\n${chat}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ImproveRequest>;
    const fields = clampFields(body.fields);
    const target = body.target;

    let transcript: ChatTurn[] = Array.isArray(body.transcript)
      ? body.transcript.filter(
          (m): m is ChatTurn =>
            !!m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string',
        )
      : [];
    // Trim from the front — the recent turns carry the freshest facts.
    let total = transcript.reduce((n, m) => n + m.text.length, 0);
    while (total > MAX_TRANSCRIPT_CHARS && transcript.length) {
      total -= transcript[0].text.length;
      transcript = transcript.slice(1);
    }

    if (target === 'assist') {
      const out = await geminiJson<{
        objective: string;
        keywords: string[];
        requiredExpertise: string[];
      }>({
        system: `You are the xFUSION challenge assistant. Based on the whole challenge below, produce the three suggestion sections of the wizard's "AI Assistance" step. Clear business English; concrete and measurable; reuse the user's own facts and numbers.
- objective: 3–5 bullets, each on its own line starting with "• ", each short and measurable (KPIs where possible). Max ${LIMITS.objective} characters. If the current objective is already strong, refine it rather than replacing its substance.
- keywords: exactly 8–10 lowercase search phrases for solver matching, including cross-industry angles. Include the existing keywords only when they are genuinely good.
- requiredExpertise: 5–8 expertise areas a solver should bring.
Answer with JSON matching the schema.`,
        turns: [{ role: 'user', text: contextBlock(fields, transcript) }],
        schema: ASSIST_SCHEMA,
      });
      const response: ImproveResponse = {
        suggestions: {
          objective: String(out.objective ?? '').slice(0, LIMITS.objective),
          keywords: (Array.isArray(out.keywords) ? out.keywords : [])
            .map((k) => String(k).trim())
            .filter(Boolean)
            .slice(0, MAX_KEYWORDS),
          requiredExpertise: (Array.isArray(out.requiredExpertise) ? out.requiredExpertise : [])
            .map((e) => String(e).trim())
            .filter(Boolean)
            .slice(0, MAX_EXPERTISE),
        },
      };
      return NextResponse.json(response);
    }

    if (!IMPROVABLE.includes(target as Improvable)) {
      return NextResponse.json({ error: 'Unsupported improve target.' }, { status: 400 });
    }
    const key = target as Improvable;
    const isArrayTarget = key === 'keywords';
    const currentValue = fields[key];

    const out = await geminiJson<{ improved: string | string[] }>({
      system: `You are the xFUSION challenge assistant behind a per-field "improve with AI" button.
TASK — improve exactly one field: "${key}".
${FIELD_BRIEFS[key]}
Base your rewrite on the field's current value plus the surrounding challenge context. Never invent facts or numbers the user didn't give. Answer with JSON matching the schema.`,
      turns: [
        {
          role: 'user',
          text: `${contextBlock(fields, transcript)}\n\nFIELD TO IMPROVE: ${key}\nCURRENT VALUE\n${
            Array.isArray(currentValue) ? currentValue.join(', ') : currentValue
          }`,
        },
      ],
      schema: isArrayTarget ? ARRAY_SCHEMA : STRING_SCHEMA,
    });

    let improved: string | string[];
    if (isArrayTarget) {
      improved = (Array.isArray(out.improved) ? out.improved : [])
        .map((k) => String(k).trim().toLowerCase())
        .filter((k) => k && !fields.keywords.includes(k))
        .slice(0, MAX_KEYWORDS);
    } else {
      const max = LIMITS[key];
      improved = String(out.improved ?? '').trim().slice(0, max);
    }
    if (!improved || (Array.isArray(improved) && improved.length === 0)) {
      return NextResponse.json({ error: 'The AI returned nothing usable — try again.' }, { status: 502 });
    }
    return NextResponse.json({ improved } satisfies ImproveResponse);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Improve failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
