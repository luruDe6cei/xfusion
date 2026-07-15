// AI Tips for the wizard sidebar (XF2-13, ADR-006): 2–3 short tips generated
// from the current step, field values and chat transcript. The client caches
// per step and only calls on step entry / after chat turns; static tips are
// its fallback, so an error here is never user-visible.
import { NextResponse } from 'next/server';
import { geminiJson, type ChatTurn } from '@/lib/gemini';
import {
  EMPTY_FIELDS,
  LIMITS,
  STEPS,
  type TipsRequest,
  type TipsResponse,
  type WizardFields,
} from '@/lib/wizard-shared';

const MAX_TRANSCRIPT_CHARS = 12_000;

const STEP_FOCUS: Record<number, string> = {
  1: 'the challenge name, short description, domain/category classification and keywords',
  2: 'the measurable objective (KPIs), required expertise and deployment timeline',
  3: 'the incentives / partnership offer and supporting documents',
  4: 'whether to accept the AI suggestions for objectives, keywords and expertise',
  5: 'final review before publishing — completeness, clarity, consistency between sections',
};

const SCHEMA = {
  type: 'OBJECT',
  properties: { tips: { type: 'ARRAY', items: { type: 'STRING' } } },
  required: ['tips'],
} as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TipsRequest>;
    const step = Math.min(5, Math.max(1, Number(body.step) || 1));
    const f = { ...EMPTY_FIELDS, ...(typeof body.fields === 'object' ? body.fields : {}) } as WizardFields;

    let transcript: ChatTurn[] = Array.isArray(body.transcript)
      ? body.transcript.filter(
          (m): m is ChatTurn =>
            !!m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string',
        )
      : [];
    let total = transcript.reduce((n, m) => n + m.text.length, 0);
    while (total > MAX_TRANSCRIPT_CHARS && transcript.length) {
      total -= transcript[0].text.length;
      transcript = transcript.slice(1);
    }

    const form = JSON.stringify({
      name: String(f.name ?? '').slice(0, LIMITS.name),
      shortDescription: String(f.shortDescription ?? '').slice(0, LIMITS.shortDescription),
      industry: f.industry,
      category: f.category,
      keywords: Array.isArray(f.keywords) ? f.keywords.slice(0, 20) : [],
      objective: String(f.objective ?? '').slice(0, LIMITS.objective),
      requiredExpertise: Array.isArray(f.requiredExpertise) ? f.requiredExpertise.slice(0, 15) : [],
      requiredDeploymentTime: f.requiredDeploymentTime,
      rewardInformation: String(f.rewardInformation ?? '').slice(0, LIMITS.rewardInformation),
    });
    const chat = transcript.length
      ? transcript.map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n')
      : '(no conversation yet)';

    const out = await geminiJson<{ tips: string[] }>({
      system: `You write the "Tips" sidebar of the xFUSION challenge wizard. The user is on step ${step} of 5 ("${STEPS[step - 1]}"), which is about ${STEP_FOCUS[step]}.
Write 2–3 tips SPECIFIC to what this user has entered and discussed so far — reference their actual content (gaps, vagueness, missed opportunities), never generic advice they could read anywhere. Each tip: one or two short sentences, max 180 characters, no numbering, no markdown. If their content is strong, say what to double-check rather than inventing problems.
Answer with JSON matching the schema.`,
      turns: [{ role: 'user', text: `FORM STATE\n${form}\n\nCONVERSATION\n${chat}` }],
      schema: SCHEMA,
    });

    const tips = (Array.isArray(out.tips) ? out.tips : [])
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 3);
    if (!tips.length) return NextResponse.json({ error: 'No tips generated.' }, { status: 502 });
    return NextResponse.json({ tips } satisfies TipsResponse);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Tips generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
