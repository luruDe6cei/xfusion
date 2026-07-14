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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: opts.schema,
          temperature: 0.7,
        },
      }),
    },
  );

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
