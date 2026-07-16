import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    readerTheme: settings?.readerTheme ?? "DEFAULT",
    fontPreference: settings?.fontPreference ?? "SANS",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { readerTheme, fontPreference } = await req.json();

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, readerTheme, fontPreference },
    update: { readerTheme, fontPreference },
  });

  return NextResponse.json({ settings });
}
