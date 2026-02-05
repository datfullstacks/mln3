import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Session } from "@/lib/models/session";
import { broadcastLobbyUpdate, broadcastSessionStart } from "@/lib/realtime";

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
    return NextResponse.json({ error: "Session ended" }, { status: 409 });
  }

  if (session.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Session expired" }, { status: 410 });
  }

  session.status = "running";
  await session.save();

  await broadcastSessionStart(code);
  await broadcastLobbyUpdate(code);

  return NextResponse.json({ code, status: session.status });
}
