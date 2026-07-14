import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENRES = [
  "FICTION",
  "NON_FICTION",
  "BUSINESS",
  "SCIENCE",
  "BIOGRAPHY",
  "SELF_HELP",
  "TECHNICAL",
  "HISTORY",
  "PHILOSOPHY",
  "OTHER",
] as const;

/**
 * Classifies a book's genre from a short text sample (title + first-page excerpt).
 * One cheap LLM call per upload — falls back to OTHER on any failure so a
 * classification hiccup never blocks the upload itself.
 */
export async function classifyGenre(textSample: string): Promise<(typeof GENRES)[number] | "UNCATEGORIZED"> {
  if (!textSample.trim()) return "UNCATEGORIZED";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Classify the book excerpt into exactly one of: ${GENRES.join(", ")}. Respond with only that single word.`,
        },
        { role: "user", content: textSample.slice(0, 3000) },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "").trim().toUpperCase();
    return (GENRES as readonly string[]).includes(raw) ? (raw as (typeof GENRES)[number]) : "OTHER";
  } catch {
    return "OTHER";
  }
}
