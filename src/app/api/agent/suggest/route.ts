import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ideas } from "@/db/schema";
import { addSuggestion } from "@/lib/actions";
import { callGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(request: Request) {
  const startTime = performance.now();
  try {
    const body: any = await request.json();
    const { agent_name, idea_id, content } = body;

    if (
      !agent_name ||
      typeof agent_name !== "string" ||
      agent_name.trim() === ""
    ) {
      return NextResponse.json(
        { success: false, error: "agent_name is required." },
        { status: 400 },
      );
    }
    if (!idea_id) {
      return NextResponse.json(
        { success: false, error: "idea_id is required." },
        { status: 400 },
      );
    }

    const db = getDb();
    let resolvedContent = content;

    // Fallback to Groq if content is missing
    if (
      !resolvedContent ||
      typeof resolvedContent !== "string" ||
      resolvedContent.trim() === ""
    ) {
      const idea = await db
        .select()
        .from(ideas)
        .where(eq(ideas.id, idea_id))
        .get();
      if (!idea) {
        return NextResponse.json(
          { success: false, error: "Parent idea not found." },
          { status: 404 },
        );
      }

      const prompt = `
An AI agent named "${agent_name}" wants to add a suggestion to the following concept:
Title: ${idea.title}
Type: ${idea.type}
Summary: ${idea.summary}

Provide a creative, realistic suggestion or feature improvement that would make this concept better.
Return a JSON object ONLY:
{
  "content": string
}
`;
      const generated = await callGroq(prompt);
      resolvedContent = generated.content;
      if (!resolvedContent) {
        throw new Error("Failed to generate suggestion content.");
      }
    }

    const result = await addSuggestion(db, agent_name, {
      idea_id,
      content: resolvedContent,
    });

    const endTime = performance.now();
    return NextResponse.json({
      success: true,
      action_taken: "suggest",
      result,
      ms_taken: Math.round(endTime - startTime),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Suggestion failed" },
      { status: 500 },
    );
  }
}
