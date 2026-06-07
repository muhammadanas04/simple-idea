export function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export async function callGroq(prompt: string, jsonMode: boolean = true) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error(
      "GROQ_API_KEY is not configured in the server environment.",
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        response_format: jsonMode ? { type: "json_object" } : undefined,
        messages: [
          {
            role: "system",
            content: jsonMode
              ? "You are a strict JSON-only assistant. Return valid JSON only."
              : "You are a helpful assistant.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${errText}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  return jsonMode ? JSON.parse(cleanJsonString(content)) : content;
}
