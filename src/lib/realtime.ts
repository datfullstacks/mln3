import { connectDB } from "@/lib/db";
import { LeaderboardEntry } from "@/lib/models/leaderboard";
import { Participant } from "@/lib/models/participant";
import { Session } from "@/lib/models/session";
import { getSupabaseServer } from "@/lib/supabase";

export type LobbyUpdatePayload = {
  code: string;
  status: "lobby" | "running" | "ended";
  count: number;
  participants: { playerId: string; username: string }[];
};

export type LeaderboardUpdatePayload = {
  code: string;
  entries: {
    playerId: string;
    username: string;
    score: number;
    totalTimeMs: number;
    rank: number;
  }[];
};

async function broadcast(code: string, event: string, payload: unknown) {
  const client = getSupabaseServer();
  if (!client) return;

  const channel = client.channel(`session:${code}`, {
    config: { broadcast: { ack: true } },
  });

  try {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 1200);
      channel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    await channel.send({ type: "broadcast", event, payload });
  } catch (error) {
    console.error("Supabase broadcast failed", error);
  } finally {
    try {
      await channel.unsubscribe();
    } catch {
      // ignore
    }
  }
}

export async function buildLobbyPayload(code: string) {
  await connectDB();
  const participants = await Participant.find({ sessionCode: code })
    .select({ _id: 0, playerId: 1, username: 1 })
    .lean();
  const session = await Session.findOne({ code })
    .select({ status: 1 })
    .lean();
  const status =
    session?.status === "running"
      ? "running"
      : session?.status === "ended"
        ? "ended"
        : "lobby";

  const payload: LobbyUpdatePayload = {
    code,
    status,
    count: participants.length,
    participants,
  };
  return payload;
}

export async function buildLeaderboardPayload(code: string) {
  await connectDB();
  const entries = await LeaderboardEntry.find({ sessionCode: code })
    .sort({ score: -1, totalTimeMs: 1, updatedAt: 1 })
    .select({ _id: 0, sessionCode: 0 })
    .lean();

  const ranked = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const payload: LeaderboardUpdatePayload = {
    code,
    entries: ranked,
  };

  return payload;
}

export async function broadcastLobbyUpdate(code: string) {
  const payload = await buildLobbyPayload(code);
  await broadcast(code, "lobby:update", payload);
  return payload;
}

export async function broadcastLeaderboardUpdate(code: string) {
  const payload = await buildLeaderboardPayload(code);
  await broadcast(code, "leaderboard:update", payload);
  return payload;
}

export async function broadcastSessionStart(code: string) {
  await broadcast(code, "session:start", {
    code,
    startedAt: new Date().toISOString(),
  });
}

export async function broadcastSessionEnded(
  code: string,
  reason?: string
) {
  await broadcast(code, "session:ended", {
    code,
    endedAt: new Date().toISOString(),
    reason,
  });
}
