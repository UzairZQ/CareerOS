import "server-only";

export type AiProvider = "gemini" | "groq" | "openrouter";

export type AiInsightKind = "skill-gap" | "ats-check" | "application-angle";

const providerModels = {
  gemini: process.env.CAREEROS_GEMINI_MODEL ?? "gemini-2.5-flash",
  groq: process.env.CAREEROS_GROQ_MODEL ?? "openai/gpt-oss-20b",
  openrouter: process.env.CAREEROS_OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
} satisfies Record<AiProvider, string>;

export const providerLabels: Record<AiProvider, string> = {
  gemini: "Gemini",
  groq: "Groq",
  openrouter: "OpenRouter",
};

export function isAiProvider(value: string): value is AiProvider {
  return value === "gemini" || value === "groq" || value === "openrouter";
}

export async function requestAiInsight({
  apiKey,
  input,
  kind,
  provider,
}: {
  apiKey: string;
  input: unknown;
  kind: AiInsightKind;
  provider: AiProvider;
}) {
  const prompt = buildInsightPrompt(kind, input);

  if (provider === "gemini") {
    return requestGemini(apiKey, prompt);
  }

  if (provider === "groq") {
    return requestOpenAiCompatible({
      apiKey,
      body: {
        model: providerModels.groq,
        messages: buildMessages(prompt),
        temperature: 0.2,
      },
      url: "https://api.groq.com/openai/v1/chat/completions",
    });
  }

  return requestOpenAiCompatible({
      apiKey,
      body: {
        model: providerModels.openrouter,
        messages: buildMessages(prompt),
        temperature: 0.2,
    },
    url: "https://openrouter.ai/api/v1/chat/completions",
  });
}

function buildMessages(prompt: string) {
  return [
    {
      role: "system",
      content:
        "You are CareerOS Germany. Give ethical, evidence-backed job search advice. Do not invent experience. Keep the answer concise.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}

function buildInsightPrompt(kind: AiInsightKind, input: unknown) {
  return `Task: ${kind}

Use only the data below. If evidence is missing, say so directly. Do not generate a fake full CV.

Return:
1. One practical insight
2. One risk or missing-proof warning
3. One next action

Data:
${JSON.stringify(input, null, 2)}`;
}

async function requestGemini(apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${providerModels.gemini}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(30_000),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(extractProviderError(data, "Gemini request failed."));
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No insight returned.";
}

async function requestOpenAiCompatible({
  apiKey,
  body,
  url,
}: {
  apiKey: string;
  body: unknown;
  url: string;
}) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "CareerOS Germany",
    },
    method: "POST",
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(extractProviderError(data, "AI provider request failed."));
  }

  return data?.choices?.[0]?.message?.content || "No insight returned.";
}

function extractProviderError(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }

  return fallback;
}
