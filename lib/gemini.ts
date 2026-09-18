import "server-only";

type GeminiOptions = {
  temperature?: number;
  maxOutputTokens?: number;
};

type GeminiRequestBody = {
  contents: Array<{ parts: Array<{ text: string }> }>;
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    thinkingConfig: { thinkingBudget: number };
  };
};

/** Server-only helper for the existing Gemini generateContent integration. */
export async function askGemini(
  prompt: string,
  systemInstruction?: string,
  options: GeminiOptions = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  body.generationConfig = {
    temperature: options.temperature ?? 0.25,
    topP: 0.85,
    maxOutputTokens: options.maxOutputTokens ?? 2_200,
    // Gemini 2.5 counts hidden thinking tokens against maxOutputTokens. These
    // tasks are grounded ranking/explanation, so reserve the budget for the
    // user-visible answer instead of allowing a truncated response.
    thinkingConfig: { thinkingBudget: 0 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", res.status, errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("Gemini response was truncated; increase maxOutputTokens");
  }
  const text = candidate?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}
