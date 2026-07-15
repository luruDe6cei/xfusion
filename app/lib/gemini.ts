// Server-only Gemini REST client (xFUSION 2.0 AI intake demo).
// Plain fetch against the Generative Language API — no SDK dependency.
// Requires GEMINI_API_KEY in app/.env; model overridable via GEMINI_MODEL.

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export async function geminiJson<T>(opts: {
  system: string;
  turns: ChatTurn[];
  schema: object;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to app/.env (see .env.example) and restart the dev server.',
    );
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 120_000);
  // Gemini 2.5 models "think" by default with an unbounded dynamic budget —
  // that's seconds-to-minutes of latency our structured form-filling calls
  // don't need. 0 disables thinking on flash (2.5 Pro needs ≥128 — set the
  // env var if you switch models).
  const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? 0);

  // A stalled upstream call must become an error, never an endless hang —
  // without this, every UI that awaits a route sits on "Thinking…" forever.
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: opts.schema,
            temperature: 0.7,
            thinkingConfig: { thinkingBudget },
          },
        }),
      },
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(
        `The AI service took too long to answer (${Math.round(timeoutMs / 1000)}s) — please try again.`,
      );
    }
    throw e;
  }

  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
    '';
  return JSON.parse(text) as T;
}
