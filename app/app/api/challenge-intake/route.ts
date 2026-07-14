// xFUSION 2.0 (spec ch. 2) — conversational challenge intake.
// The client posts the transcript; Gemini either asks the next Socratic
// question (done=false) or returns the fully extracted challenge fields
// (done=true). JSON output is enforced via responseSchema.
import { NextResponse } from 'next/server';
import { geminiJson, type ChatTurn } from '@/lib/gemini';
import { getIndustries } from '@/lib/data';
import { FIRST_QUESTION, LIMITS, type IntakeResponse } from '../../challenges/new/intake-shared';

// Guardrails: the transcript is billed against the Gemini key, so cap what a
// single request may forward. 20 turns / 20k chars is far beyond any real
// intake conversation (max ~8 turns by design).
const MAX_TURNS = 20;
const MAX_TOTAL_CHARS = 20_000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    done: { type: 'BOOLEAN' },
    fields: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        name: { type: 'STRING' },
        shortDescription: { type: 'STRING' },
        objective: { type: 'STRING' },
        rewardInformation: { type: 'STRING' },
        industry: { type: 'STRING' },
        requiredDeploymentTime: {
          type: 'STRING',
          enum: ['UP_TO_3_MONTHS', 'THREE_TO_6_MONTHS', 'SIX_TO_12_MONTHS', 'ONE_YEAR_PLUS', 'NO_TIMEFRAME'],
        },
        keywords: { type: 'ARRAY', items: { type: 'STRING' } },
        requiredExpertise: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: [
        'name',
        'shortDescription',
        'objective',
        'rewardInformation',
        'industry',
        'requiredDeploymentTime',
        'keywords',
        'requiredExpertise',
      ],
    },
  },
  required: ['reply', 'done'],
} as const;

function buildSystemPrompt(industryNames: string[]): string {
  return `You are the xFUSION challenge intake assistant — a "Socratic partner" that helps an organization turn a vague pain point into a sharp, publishable open-innovation challenge.

CONVERSATION RULES
- The user was already asked: "${FIRST_QUESTION}" — their first message is the answer to it.
- Ask exactly ONE short, conversational follow-up question per turn. React in one sentence to what they said before asking; never sound like a form.
- Ask 2–3 follow-ups in total, never more than 3. Cover whichever of these are still unknown:
  1. What kind of partnership they can offer (joint development/R&D, building a POC, a paid pilot, pro-bono collaboration, a prize). Do NOT push budgets or off-the-shelf products if they sound like a hospital, university or nonprofit — they usually seek development partners, not vendors.
  2. Success criteria — what measurable outcome would make this a win.
  3. Whether the information is commercially sensitive (NDA / teaser version may be needed) and their rough timeline.
- When you have enough (or after the 3rd follow-up, whichever comes first), set done=true and produce the fields. If the user says "just generate it" or similar, set done=true immediately with best-effort fields.
- While done=false, fields must be null.

FIELD RULES (only when done=true)
- Clear business English. Short, concrete, measurable — never generic or "fluffy". Reuse the user's own vocabulary and numbers wherever possible.
- name: punchy title, max ${LIMITS.name} characters, no trailing period.
- shortDescription: the challenge statement, max ${LIMITS.shortDescription} characters, 2–4 short paragraphs: context and pain, what has been tried, what is sought. Written from the organization's perspective ("We ...").
- objective: 3–5 bullets, each on its own line starting with "• ", each short and measurable (a KPI where possible).
- rewardInformation: 1–3 sentences describing the partnership/incentive they offer.
- keywords: 6–10 lowercase search phrases. Think beyond the obvious — include cross-industry angles, ignoring traditional industry boundaries.
- requiredExpertise: 3–6 expertise areas a solver should bring.
- industry: exactly one name from this list (verbatim): ${industryNames.join(' | ')}
- requiredDeploymentTime: your best guess from their timeline; NO_TIMEFRAME if unknown.
- reply (when done=true): one sentence handing off, e.g. "Here's a draft of your challenge — review and edit anything before publishing."

ALWAYS answer with JSON matching the schema.`;
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatTurn[] };
    if (!Array.isArray(messages) || messages.length === 0 || messages[0].role !== 'user') {
      return NextResponse.json({ error: 'messages must start with a user turn' }, { status: 400 });
    }
    const wellFormed = messages.every(
      (m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string',
    );
    const totalChars = wellFormed
      ? messages.reduce((n, m) => n + m.text.length, 0)
      : Infinity;
    if (!wellFormed || messages.length > MAX_TURNS || totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: 'Conversation is too long or malformed — please start over.' },
        { status: 400 },
      );
    }

    const industries = await getIndustries();
    const out = await geminiJson<IntakeResponse>({
      system: buildSystemPrompt(industries.map((i) => i.name)),
      turns: messages,
      schema: RESPONSE_SCHEMA,
    });

    // Belt-and-braces: the model is told the limits, but enforce them anyway.
    if (out.fields) {
      out.fields.name = out.fields.name.slice(0, LIMITS.name);
      out.fields.shortDescription = out.fields.shortDescription.slice(0, LIMITS.shortDescription);
    }
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Challenge intake failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
