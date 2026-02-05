import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { LeaderboardEntry } from "@/lib/models/leaderboard";
import { broadcastLeaderboardUpdate } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const body = await request.json().catch(() => ({}));

  const playerId =
    typeof body.playerId === "string" ? body.playerId : undefined;
  const username =
    typeof body.username === "string" ? body.username : undefined;
  const score =
    typeof body.score === "number" && Number.isFinite(body.score)
      ? Math.round(body.score)
      : undefined;
  const totalTimeMs =
    typeof body.totalTimeMs === "number" && Number.isFinite(body.totalTimeMs)
      ? Math.max(0, Math.round(body.totalTimeMs))
      : undefined;

  if (!playerId) {
    return NextResponse.json(
      { error: "playerId is required" },
      { status: 400 }
    );
  }

  if (score === undefined && totalTimeMs === undefined) {
    return NextResponse.json(
      { error: "score or totalTimeMs is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof username === "string" && username.trim().length > 0) {
    set.username = username.trim();
  }
  if (score !== undefined) {
    set.score = score;
  }
  if (totalTimeMs !== undefined) {
    set.totalTimeMs = totalTimeMs;
  }

  await LeaderboardEntry.updateOne(
    { sessionCode: code, playerId },
    {
      $setOnInsert: {
        sessionCode: code,
        playerId,
        createdAt: new Date(),
      },
      $set: set,
    },
    { upsert: true }
  );

  await broadcastLeaderboardUpdate(code);

  return NextResponse.json({ ok: true });
}
