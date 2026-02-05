import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Session } from "@/lib/models/session";
import { buildLeaderboardPayload, buildLobbyPayload } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

  const lobby = await buildLobbyPayload(code);
  const leaderboard = await buildLeaderboardPayload(code);

  return NextResponse.json({
    code,
    status: session.status,
    lobby,
    leaderboard,
  });
}
