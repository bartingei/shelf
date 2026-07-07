import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/explain
// body: { selectedText: string, bookCategory: "EDUCATION" | "NOVEL", contextUpToPage: string }
// contextUpToPage is critical for novels — only pass content up to the reader's current
// position so "Explain this" never spoils content the user hasn't reached yet.
export async function POST(req: NextRequest) {
  const { selectedText, bookCategory, contextUpToPage } = await req.json();

  if (!selectedText) {
    return NextResponse.json({ error: "Missing selectedText" }, { status: 400 });
  }

  const systemPrompt =
    bookCategory === "NOVEL"
      ? "You explain passages from novels clearly and concisely. Never reveal plot points beyond the provided context — treat anything not in the context as a spoiler and avoid it."
      : "You explain academic/technical passages clearly and concisely, as a helpful tutor would.";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Context read so far (truncated):\n${contextUpToPage ?? ""}\n\nExplain this: "${selectedText}"`,
      },
    ],
  });

  return NextResponse.json({ explanation: completion.choices[0]?.message?.content ?? "" });
}
