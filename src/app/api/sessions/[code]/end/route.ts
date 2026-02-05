import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Session } from "@/lib/models/session";
import { getIO } from "@/lib/socket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  await connectDB();

  const session = await Session.findOne({ code });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "ended") {
    return NextResponse.json({ code, status: session.status });
  }

  session.status = "ended";
  await session.save();

  const io = getIO();
  io?.to(`session:${code}`).emit("session:ended", {
    code,
    endedAt: new Date().toISOString(),
  });

  return NextResponse.json({ code, status: session.status });
}
