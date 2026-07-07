import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/summarize
// body: { text: string, scope: "selection" | "chapter" | "book" }
export async function POST(req: NextRequest) {
  const { text, scope } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Summarize the following ${scope ?? "selection"} concisely, capturing the key points a reader would want to remember.`,
      },
      { role: "user", content: text },
    ],
  });

  return NextResponse.json({ summary: completion.choices[0]?.message?.content ?? "" });
}
