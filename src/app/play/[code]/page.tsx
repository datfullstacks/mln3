"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import PhaserGame from "@/components/PhaserGame";

interface PlayerInfo {
  playerId: string;
  username: string;
  code: string;
}

type LobbyUpdatePayload = {
  participants?: { playerId: string; username: string }[];
  status?: "lobby" | "running";
};

type SessionErrorPayload = {
  error?: string;
};

type LeaderboardUpdatePayload = {
  entries?: {
    playerId: string;
    username: string;
    score: number;
    totalTimeMs: number;
    rank: number;
  }[];
};

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"lobby" | "running">(
    "lobby"
  );
  const [leaderboard, setLeaderboard] = useState<
    {
      playerId: string;
      username: string;
      score: number;
      totalTimeMs: number;
      rank: number;
    }[]
  >([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [endingStatus, setEndingStatus] = useState<"completed" | "eliminated" | null>(
    null
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      const stored =
        typeof window !== "undefined"
          ? sessionStorage.getItem("player")
          : null;
      if (stored) {
        try {
          const parsed: PlayerInfo = JSON.parse(stored);
          if (params?.code && parsed.code === params.code.toString()) {
            setPlayer(parsed);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
      const fromQuery = search?.get("player");
      if (fromQuery && params?.code) {
        setPlayer({
          playerId: fromQuery,
          username: "Bạn",
          code: params.code.toString(),
        });
      }
    }, 0);
    return () => {
      cancelled = true;
    };
  }, [params?.code, search]);

  useEffect(() => {
    if (!player) return;
    let socket: Socket | null = null;
    let active = true;

    const init = async () => {
      const { io } = await import("socket.io-client");
      await fetch("/api/socket");
      socket = io({ path: "/api/socket" });
      socketRef.current = socket;
      socket.emit("session:join", {
        code: player.code,
        playerId: player.playerId,
        username: player.username,
        role: "player",
      });
      socket.on("lobby:update", (payload: LobbyUpdatePayload) => {
        if (!active) return;
        if (payload.status) setSessionStatus(payload.status);
      });
      socket.on("session:start", () => {
        if (!active) return;
        setSessionStatus("running");
      });
      socket.on("session:ended", () => {
        if (!active) return;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("player");
        }
        router.push("/join?ended=1");
      });
      socket.on("leaderboard:update", (payload: LeaderboardUpdatePayload) => {
        if (!active) return;
        setLeaderboard(payload.entries ?? []);
      });
      socket.on("session:error", (payload: SessionErrorPayload) => {
        if (!active) return;
        console.error(payload?.error || "Session error");
      });
    };

    init();

    return () => {
      active = false;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [player, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleShow = () => setShowLeaderboard(true);
    const handleHide = () => {
      setShowLeaderboard(false);
      setEndingStatus(null);
    };
    const handleEnding = (event: Event) => {
      const detail =
        event && "detail" in event ? (event as CustomEvent).detail : undefined;
      const status =
        detail && (detail.status === "completed" || detail.status === "eliminated")
          ? detail.status
          : "completed";
      setEndingStatus(status);
      setShowLeaderboard(false);
    };
    const handleScore = (event: Event) => {
      const detail =
        event && "detail" in event ? (event as CustomEvent).detail : undefined;
      const score =
        detail && typeof detail.score === "number" ? detail.score : null;
      if (score === null || !player || !socketRef.current) return;
      socketRef.current.emit("score:submit", {
        code: player.code,
        playerId: player.playerId,
        username: player.username,
        score,
      });
    };

    window.addEventListener("game:leaderboard", handleShow);
    window.addEventListener("game:leaderboard-hide", handleHide);
    window.addEventListener("game:ending", handleEnding);
    window.addEventListener("game:score", handleScore as EventListener);

    return () => {
      window.removeEventListener("game:leaderboard", handleShow);
      window.removeEventListener("game:leaderboard-hide", handleHide);
      window.removeEventListener("game:ending", handleEnding);
      window.removeEventListener("game:score", handleScore as EventListener);
    };
  }, [player]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f6f0e9] text-[#3b2f2a]">
      <div className="relative h-full w-full">
        {sessionStatus === "running" ? (
          <PhaserGame />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6">
            <div className="rounded-2xl border border-[#d9c7b5] bg-[#fffaf5]/95 px-6 py-5 text-center shadow-[0_12px_40px_rgba(124,96,78,0.18)]">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8b7a6f]">
                Đang chờ
              </p>
              <p className="mt-2 text-lg text-[#3b2f2a]">
                Chờ đội thành chờ người chơi khác
              </p>
              <p className="mt-2 text-sm text-[#8b7a6f]">
                Hãy giữ trang này mở.
              </p>
            </div>
          </div>
        )}

                {sessionStatus === "running" && !endingStatus && !showLeaderboard && (
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="absolute right-6 top-6 z-20 rounded-full border border-[#c9b7a4] bg-[#f5ede3]/90 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#7a5f4e] backdrop-blur transition hover:border-[#bca792] hover:text-[#5e4a3d]"
          >
            Leaderboard phụ
          </button>
        )}

        {sessionStatus === "running" && !endingStatus && showLeaderboard && (
          <div className="pointer-events-none absolute right-6 top-6 z-20 w-full max-w-xs">
            <div className="pointer-events-auto rounded-2xl border border-[#d9c7b5] bg-[#fffaf5]/95 p-3 shadow-[0_18px_50px_rgba(124,96,78,0.25)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#3b2f2a]">Leaderboard phụ</h2>
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(false)}
                  className="rounded-md border border-[#ccb9a6] px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7a5f4e] transition hover:border-[#bca792] hover:text-[#5e4a3d]"
                >
                  Đóng
                </button>
              </div>
              {leaderboard.length === 0 ? (
                <p className="mt-2 text-xs text-[#8b7a6f]">Chưa có dữ liệu điểm.</p>
              ) : (
                <div className="mt-2 space-y-1 text-xs text-[#3b2f2a]">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <div key={entry.playerId} className="flex items-center justify-between">
                      <span>#{entry.rank} {entry.username}</span>
                      <span className="font-semibold text-[#5f4636]">{entry.score}đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {sessionStatus === "running" && endingStatus && (
          <div className="pointer-events-none absolute right-6 top-6 z-20 w-full max-w-md">
            <div className="pointer-events-auto rounded-2xl border border-[#d9c7b5] bg-[#fffaf5]/95 p-4 shadow-[0_18px_50px_rgba(124,96,78,0.25)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#3b2f2a]">Leaderboard tổng</h2>
              </div>
              {leaderboard.length === 0 ? (
                <p className="mt-3 text-sm text-[#8b7a6f]">Chưa có dữ liệu điểm.</p>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-[#3b2f2a]">
                  <div className="rounded-xl border border-[#d7c2af] bg-[#fdf4ea] px-3 py-2 text-[13px] text-[#5e4a3d]">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#b48462]">Happy ending</p>
                    <p className="mt-1 text-sm text-[#3b2f2a]">
                      {endingStatus === "eliminated"
                        ? "Dù dừng lại giữa chừng, bạn vẫn đã tích lũy bài học để hướng đến một mái ấm bền vững."
                        : "Bạn đã hoàn thành hành trình. Chúc bạn viên mãn trong hôn nhân."}
                    </p>
                  </div>
                  {leaderboard.map((entry) => {
                    const isTop = entry.rank <= 3;
                    const isSelf = player?.playerId === entry.playerId;
                    return (
                      <div
                        key={entry.playerId}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${isTop
                          ? "border-[#d5b79a] bg-[#f7eadf] shadow-[0_8px_18px_rgba(124,96,78,0.18)]"
                          : "border-[#efe2d6] bg-white/80"} ${isSelf ? "ring-1 ring-[#b88a6b]" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#5f4636]">#{entry.rank}</span>
                          <span>{entry.username}</span>
                          {isTop && (
                            <span className="rounded-full border border-[#c8a383] bg-[#fdf2e8] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#8a5e3f]">
                              Top {entry.rank}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[#5f4636]">{entry.score}đ</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-xs text-[#8b7a6f]">
                Bảng xếp hạng cập nhật theo thời gian thực.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
