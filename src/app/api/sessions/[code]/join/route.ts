import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { Session } from "@/lib/models/session";
import { Participant } from "@/lib/models/participant";
import { LeaderboardEntry } from "@/lib/models/leaderboard";
import { sanitizeUsername } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const body = await request.json().catch(() => ({}));
  const rawUsername = typeof body.username === "string" ? body.username : "";
  const username = sanitizeUsername(rawUsername);

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

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

  const currentCount = await Participant.countDocuments({ sessionCode: code });
  if (session.maxPlayers && currentCount >= session.maxPlayers) {
    return NextResponse.json({ error: "Session full" }, { status: 409 });
  }

  const playerId = randomUUID();

  await Participant.create({
    sessionCode: code,
    playerId,
    username,
  });

  await LeaderboardEntry.updateOne(
    { sessionCode: code, playerId },
    {
      $setOnInsert: {
        sessionCode: code,
        playerId,
        username,
        score: 0,
        totalTimeMs: 0,
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({
    playerId,
    session: { code: session.code, status: session.status },
    username,
  });
}
