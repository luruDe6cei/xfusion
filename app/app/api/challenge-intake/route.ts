// Chat Dock copilot (XF2-13, ADR-006). The client posts the transcript PLUS the
// wizard's current field state, which fields the user touched, and the current
// step. Gemini replies conversationally and extracts whatever it newly learned
// into fieldUpdates — the client auto-fills untouched fields and renders
// "Apply" chips for touched ones. JSON output enforced via responseSchema.
import { NextResponse } from 'next/server';
import { geminiJson, type ChatTurn } from '@/lib/gemini';
import { getIndustries, getSubIndustries } from '@/lib/data';
import {
  DEPLOYMENT_OPTIONS,
  EMPTY_FIELDS,
  FIRST_QUESTION,
  LIMITS,
  MAX_EXPERTISE,
  MAX_KEYWORDS,
  type AiFieldKey,
  type FieldUpdates,
  type IntakeRequest,
  type IntakeResponse,
  type WizardFields,
} from '@/lib/wizard-shared';

// Guardrails: the transcript is billed against the Gemini key, so cap what a
// single request may forward. The dock is a long-lived copilot, hence roomier
// caps than the old 3-question intake.
const MAX_TURNS = 40;
const MAX_TOTAL_CHARS = 30_000;

const AI_KEYS: AiFieldKey[] = [
  'name',
  'shortDescription',
  'industry',
  'category',
  'keywords',
  'objective',
  'requiredExpertise',
  'requiredDeploymentTime',
  'rewardInformation',
];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    fieldUpdates: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        name: { type: 'STRING', nullable: true },
        shortDescription: { type: 'STRING', nullable: true },
        industry: { type: 'STRING', nullable: true },
        category: { type: 'STRING', nullable: true },
        keywords: { type: 'ARRAY', nullable: true, items: { type: 'STRING' } },
        objective: { type: 'STRING', nullable: true },
        requiredExpertise: { type: 'ARRAY', nullable: true, items: { type: 'STRING' } },
        requiredDeploymentTime: {
          type: 'STRING',
          nullable: true,
          enum: DEPLOYMENT_OPTIONS.map((o) => o.value),
        },
        rewardInformation: { type: 'STRING', nullable: true },
      },
    },
  },
  required: ['reply'],
} as const;

function buildSystemPrompt(opts: {
  industries: string[];
  categories: string[];
  fields: WizardFields;
  touched: AiFieldKey[];
  step: number;
}): string {
  const { industries, categories, fields, touched, step } = opts;
  const formState = JSON.stringify(
    Object.fromEntries(AI_KEYS.map((k) => [k, fields[k]])),
  );
  return `You are the xFUSION challenge copilot — a "Socratic partner" embedded beside a 5-step "Create a Challenge" wizard (1 Basic Information, 2 Objectives & Requirements, 3 Incentives & Supporting Data, 4 AI Assistance, 5 Review). You help an organization turn a vague pain point into a sharp, publishable open-innovation challenge, filling the form for them as the conversation progresses.

CURRENT WIZARD STATE
- The user is on step ${step}.
- Current form values: ${formState}
- Fields the user edited BY HAND: ${touched.length ? touched.join(', ') : '(none)'}

CONVERSATION RULES
- The user was already greeted with: "${FIRST_QUESTION}" — their first message answers it.
- Reply in 1–3 short conversational sentences. React to what they said; never sound like a form.
- If important information is still missing, end your reply with ONE short follow-up question. Prioritize whichever is still unknown: what partnership they can offer (joint development/R&D, POC, paid pilot, pro-bono, prize — do NOT push budgets or off-the-shelf products on hospitals, universities or nonprofits), measurable success criteria, timeline, commercial sensitivity.
- When the form is essentially complete, don't ask more questions — tell them the form is filled in and invite them to review each step and publish.

FIELD EXTRACTION RULES (fieldUpdates — with EVERY reply)
- Extract whatever you NEWLY learned this turn into fieldUpdates. Include ONLY fields you have real information for; omit everything else. Do not resend values that already match the form.
- Fields the user edited by hand belong to them: only propose a value for a hand-edited field when the conversation clearly justifies a change (the UI shows it as an optional suggestion, it will not overwrite).
- Clear business English. Short, concrete, measurable — never generic. Reuse the user's own vocabulary and numbers.
- name: punchy title, max ${LIMITS.name} chars, no trailing period.
- shortDescription: the challenge statement, max ${LIMITS.shortDescription} chars, 2–4 short paragraphs from the organization's perspective ("We ..."): context and pain, what was tried, what is sought.
- objective: 3–5 bullets, each on its own line starting with "• ", each short and measurable (a KPI where possible). Max ${LIMITS.objective} chars.
- rewardInformation: 1–3 sentences describing the partnership/incentive offered. Max ${LIMITS.rewardInformation} chars.
- keywords: 6–10 lowercase search phrases, cross-industry angles included. Max ${MAX_KEYWORDS}.
- requiredExpertise: 3–6 expertise areas a solver should bring. Max ${MAX_EXPERTISE}.
- industry: exactly one name from this list (verbatim): ${industries.join(' | ')}
- category: exactly one name from this list (verbatim), or omit if none fits: ${categories.join(' | ')}
- requiredDeploymentTime: your best guess from their timeline; omit if unknown.

ALWAYS answer with JSON matching the schema.`;
}

// Belt-and-braces: clamp/validate everything the model proposed before it
// reaches the client.
function sanitizeUpdates(
  raw: FieldUpdates | null | undefined,
  industries: string[],
  categories: string[],
): FieldUpdates | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: FieldUpdates = {};
  const str = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
  const arr = (v: unknown, maxItems: number, maxLen: number) =>
    Array.isArray(v)
      ? v
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim().slice(0, maxLen))
          .filter(Boolean)
          .slice(0, maxItems)
      : undefined;

  const name = str(raw.name, LIMITS.name);
  if (name) out.name = name;
  const sd = str(raw.shortDescription, LIMITS.shortDescription);
  if (sd) out.shortDescription = sd;
  const obj = str(raw.objective, LIMITS.objective);
  if (obj) out.objective = obj;
  const reward = str(raw.rewardInformation, LIMITS.rewardInformation);
  if (reward) out.rewardInformation = reward;
  const industry = str(raw.industry, 80);
  if (industry && industries.includes(industry)) out.industry = industry;
  const category = str(raw.category, 80);
  if (category && categories.includes(category)) out.category = category;
  const dep = str(raw.requiredDeploymentTime, 40);
  if (dep && DEPLOYMENT_OPTIONS.some((o) => o.value === dep)) out.requiredDeploymentTime = dep;
  const kw = arr(raw.keywords, MAX_KEYWORDS, 60);
  if (kw?.length) out.keywords = kw;
  const exp = arr(raw.requiredExpertise, MAX_EXPERTISE, 80);
  if (exp?.length) out.requiredExpertise = exp;
  return Object.keys(out).length ? out : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<IntakeRequest>;
    const messages = body.messages as ChatTurn[];
    if (!Array.isArray(messages) || messages.length === 0 || messages[0].role !== 'user') {
      return NextResponse.json({ error: 'messages must start with a user turn' }, { status: 400 });
    }
    const wellFormed = messages.every(
      (m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string',
    );
    const totalChars = wellFormed ? messages.reduce((n, m) => n + m.text.length, 0) : Infinity;
    if (!wellFormed || messages.length > MAX_TURNS || totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: 'Conversation is too long or malformed — please start over.' },
        { status: 400 },
      );
    }

    // The client's field state goes into the prompt — clamp it defensively.
    const f = { ...EMPTY_FIELDS, ...(typeof body.fields === 'object' ? body.fields : {}) };
    const fields: WizardFields = {
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
    const touched = (Array.isArray(body.touched) ? body.touched : []).filter((k): k is AiFieldKey =>
      AI_KEYS.includes(k as AiFieldKey),
    );
    const step = Math.min(5, Math.max(1, Number(body.step) || 1));

    const [industries, subIndustries] = await Promise.all([getIndustries(), getSubIndustries()]);
    const industryNames = industries.map((i) => i.name);
    const categoryNames = subIndustries.map((s) => s.name);

    const out = await geminiJson<{ reply: string; fieldUpdates?: FieldUpdates | null }>({
      system: buildSystemPrompt({
        industries: industryNames,
        categories: categoryNames,
        fields,
        touched,
        step,
      }),
      turns: messages,
      schema: RESPONSE_SCHEMA,
    });

    const response: IntakeResponse = {
      reply: typeof out.reply === 'string' ? out.reply : '…',
      fieldUpdates: sanitizeUpdates(out.fieldUpdates, industryNames, categoryNames),
    };
    return NextResponse.json(response);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Challenge intake failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
