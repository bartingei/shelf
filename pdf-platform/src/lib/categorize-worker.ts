import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Categorizes a single book as EDUCATION / NOVEL / UNKNOWN.
 *
 * Intended to be called by a background worker (cron route, queue consumer, etc.)
 * picking up PENDING rows from ProcessingJob where type = "CATEGORIZE".
 * Kept as one cheap LLM call per book (not per page) to stay fast over a bulk
 * folder scan of hundreds of PDFs.
 */
export async function categorizeBook(bookId: string, extractedTextSample: string) {
  const job = await prisma.processingJob.findFirst({
    where: { bookId, type: "CATEGORIZE", status: "PENDING" },
  });
  if (!job) return;

  await prisma.processingJob.update({ where: { id: job.id }, data: { status: "PROCESSING" } });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'Classify the document as exactly one of: EDUCATION, NOVEL, UNKNOWN. Respond with only that single word.',
        },
        { role: "user", content: extractedTextSample.slice(0, 3000) },
      ],
    });

    const raw = (completion.choices[0]?.message?.content ?? "UNKNOWN").trim().toUpperCase();
    const category = ["EDUCATION", "NOVEL"].includes(raw) ? raw : "UNKNOWN";

    await prisma.book.update({
      where: { id: bookId },
      data: { category: category as "EDUCATION" | "NOVEL" | "UNKNOWN", categorizedAt: new Date() },
    });

    await prisma.processingJob.update({
      where: { id: job.id },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
  } catch (err) {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(err) },
    });
  }
}
