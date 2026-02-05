import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Session } from "@/lib/models/session";
import { Participant } from "@/lib/models/participant";
import { generateSessionCode } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const now = new Date();
  const sessions = await Session.find({
    expiresAt: { $gt: now },
    status: { $ne: "ended" },
  })
    .sort({ createdAt: -1 })
    .lean();

  const codes = sessions.map((session) => session.code);
  const counts = codes.length
    ? await Participant.aggregate([
        { $match: { sessionCode: { $in: codes } } },
        { $group: { _id: "$sessionCode", count: { $sum: 1 } } },
      ])
    : [];

  const countMap = new Map<string, number>();
  counts.forEach((entry) => {
    countMap.set(entry._id, entry.count);
  });

  return NextResponse.json({
    sessions: sessions.map((session) => ({
      code: session.code,
      status: session.status,
      maxPlayers: session.maxPlayers ?? null,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      participantCount: countMap.get(session.code) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const maxPlayers = typeof body.maxPlayers === "number" ? body.maxPlayers : 50;
  const ttlMinutes =
    typeof body.ttlMinutes === "number" && body.ttlMinutes > 0
      ? body.ttlMinutes
      : 120;

  await connectDB();

  let code = generateSessionCode();
  let attempts = 0;
  while (await Session.exists({ code })) {
    code = generateSessionCode();
    attempts += 1;
    if (attempts > 5) {
      return NextResponse.json(
        { error: "Unable to allocate session code, try again." },
        { status: 500 }
      );
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  const session = await Session.create({
    code,
    status: "lobby",
    maxPlayers,
    expiresAt,
  });

  return NextResponse.json({
    code: session.code,
    status: session.status,
    expiresAt,
  });
}
