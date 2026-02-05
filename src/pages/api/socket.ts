import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "@/lib/db";
import { Participant } from "@/lib/models/participant";
import { Session } from "@/lib/models/session";
import { LeaderboardEntry } from "@/lib/models/leaderboard";
import { setIO } from "@/lib/socket";

type SocketServer = HTTPServer & {
  io?: Server;
};

async function emitLobbyUpdate(io: Server, code: string) {
  await connectDB();
  const participants = await Participant.find({ sessionCode: code })
    .select({ _id: 0, playerId: 1, username: 1 })
    .lean();
  const session = await Session.findOne({ code })
    .select({ status: 1 })
    .lean();

  io.to(`session:${code}`).emit("lobby:update", {
    code,
    status: session?.status ?? "lobby",
    count: participants.length,
    participants,
  });
}

async function emitLeaderboardUpdate(io: Server, code: string) {
  await connectDB();
  const entries = await LeaderboardEntry.find({ sessionCode: code })
    .sort({ score: -1, totalTimeMs: 1, updatedAt: 1 })
    .select({ _id: 0, sessionCode: 0 })
    .lean();

  const ranked = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  io.to(`session:${code}`).emit("leaderboard:update", {
    code,
    entries: ranked,
  });
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket) {
    res.end();
    return;
  }
  const server = (res.socket as unknown as { server: SocketServer }).server;

  if (!server.io) {
    const io = new Server(server, { path: "/api/socket" });
    server.io = io;
    setIO(io);

    io.on("connection", (socket) => {
      socket.on(
        "session:join",
        async (payload: {
          code?: string;
          username?: string;
          playerId?: string;
          role?: "player" | "admin";
        }) => {
          const code = payload.code?.toUpperCase();
          if (!code) {
            socket.emit("session:error", { error: "Missing session code" });
            return;
          }

          await connectDB();
          const session = await Session.findOne({ code }).lean();
          if (!session) {
            socket.emit("session:error", { error: "Session not found" });
            return;
          }

          const role = payload.role ?? "player";
          if (session.status === "ended" && role !== "admin") {
            socket.emit("session:ended", {
              code,
              endedAt: new Date().toISOString(),
            });
            return;
          }

          if (session.expiresAt.getTime() < Date.now() && role !== "admin") {
            socket.emit("session:ended", {
              code,
              endedAt: new Date().toISOString(),
              reason: "expired",
            });
            return;
          }

          if (payload.playerId && payload.username) {
            await LeaderboardEntry.updateOne(
              { sessionCode: code, playerId: payload.playerId },
              {
                $setOnInsert: {
                  sessionCode: code,
                  playerId: payload.playerId,
                  score: 0,
                  totalTimeMs: 0,
                  createdAt: new Date(),
                },
                $set: { username: payload.username, updatedAt: new Date() },
              },
              { upsert: true }
            );
          }

          socket.join(`session:${code}`);
          await emitLobbyUpdate(io, code);
          await emitLeaderboardUpdate(io, code);

          if (session.status === "running") {
            socket.emit("session:start", {
              code,
              startedAt: new Date().toISOString(),
            });
          }
        }
      );

      socket.on(
        "score:submit",
        async (payload: {
          code?: string;
          playerId?: string;
          username?: string;
          deltaScore?: number;
          deltaTimeMs?: number;
          score?: number;
          totalTimeMs?: number;
        }) => {
          const code = payload.code?.toUpperCase();
          if (!code || !payload.playerId) return;

          await connectDB();

          const update: Record<string, unknown> = {
            $set: { updatedAt: new Date() },
          };

          if (payload.username) {
            (update.$set as Record<string, unknown>).username = payload.username;
          }

          const hasAbsoluteScore = typeof payload.score === "number";
          const hasAbsoluteTime = typeof payload.totalTimeMs === "number";

          if (
            typeof payload.deltaScore === "number" ||
            typeof payload.deltaTimeMs === "number"
          ) {
            update.$inc = {};
            if (
              typeof payload.deltaScore === "number" &&
              !hasAbsoluteScore
            ) {
              (update.$inc as Record<string, unknown>).score =
                payload.deltaScore;
            }
            if (
              typeof payload.deltaTimeMs === "number" &&
              !hasAbsoluteTime
            ) {
              (update.$inc as Record<string, unknown>).totalTimeMs =
                payload.deltaTimeMs;
            }
          }

          if (hasAbsoluteScore) {
            (update.$set as Record<string, unknown>).score = payload.score;
          }
          if (hasAbsoluteTime) {
            (update.$set as Record<string, unknown>).totalTimeMs =
              payload.totalTimeMs;
          }

          if (update.$inc && Object.keys(update.$inc).length === 0) {
            delete update.$inc;
          }

          const setOnInsert: Record<string, unknown> = {
            sessionCode: code,
            playerId: payload.playerId,
            createdAt: new Date(),
          };

          const incScore =
            update.$inc &&
            Object.prototype.hasOwnProperty.call(update.$inc, "score");
          const incTime =
            update.$inc &&
            Object.prototype.hasOwnProperty.call(update.$inc, "totalTimeMs");

          if (!hasAbsoluteScore && !incScore) {
            setOnInsert.score = 0;
          }
          if (!hasAbsoluteTime && !incTime) {
            setOnInsert.totalTimeMs = 0;
          }

          await LeaderboardEntry.updateOne(
            { sessionCode: code, playerId: payload.playerId },
            {
              $setOnInsert: setOnInsert,
              ...update,
            },
            { upsert: true }
          );

          await emitLeaderboardUpdate(io, code);
        }
      );
    });
  }

  res.end();
}

export const config = {
  api: { bodyParser: false },
};
