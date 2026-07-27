import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/constants";

// Files up to 100MB (see MAX_UPLOAD_BYTES) can take longer to buffer and
// push to Supabase Storage than the platform's default function timeout —
// the upload can fully succeed server-side after the client has already
// been told it failed. 60s is the max configurable on Vercel's Hobby plan.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const filePath = formData.get("filePath") as string;

  if (!file || !filePath) {
    return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} upload limit` },
      { status: 413 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from("books")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}