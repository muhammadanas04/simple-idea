import { getRequestContext } from "@cloudflare/next-on-pages";

export function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

// Function name kept as `callGroq` to avoid changing all import sites.
// It now calls the Gemini API under the hood.
export async function callGroq(prompt: string, jsonMode: boolean = true) {
  let apiKey = process.env.GEMINI_API_KEY;
  try {
    const context = getRequestContext();
    if (context && context.env && context.env.GEMINI_API_KEY) {
      apiKey = context.env.GEMINI_API_KEY as string;
    }
  } catch (e) {
    // ignore — fallback to process.env
  }

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in the server environment.",
    );
  }

  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: jsonMode
            ? "You are a strict JSON-only assistant. Return valid JSON only. Do not wrap your response in markdown code blocks."
            : "You are a helpful assistant.",
        },
      ],
    },
    generationConfig: {
      temperature: 0.1,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    const blockReason = data.candidates?.[0]?.finishReason;
    const promptFeedback = data.promptFeedback?.blockReason;
    throw new Error(
      `Empty response from Gemini API. finishReason: ${blockReason}, promptFeedback: ${promptFeedback}`,
    );
  }

  if (jsonMode) {
    const cleaned = cleanJsonString(content);
    try {
      return JSON.parse(cleaned);
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse Gemini response as JSON: ${parseError.message}. Raw content: ${cleaned.substring(0, 300)}`,
      );
    }
  }

  return content;
}
