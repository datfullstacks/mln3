"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

type LobbyUpdatePayload = {
  participants?: { playerId: string; username: string }[];
  status?: string;
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

type SessionSummary = {
  code: string;
  status: string;
  maxPlayers: number | null;
  createdAt: string;
  expiresAt: string;
  participantCount: number;
};

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  nearCorrect?: number[];
  explanation?: string;
  points: number;
  nearPoints?: number;
  pillar?: string;
  consequenceCorrect?: string;
  consequenceNear?: string;
  consequenceWrong?: string;
  riskPenalty?: number;
  timeLimitSec?: number;
};

type QuizBank = {
  updatedAt: string;
  rounds: Record<string, QuizQuestion[]>;
};

export default function AdminPage() {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [ttlMinutes, setTtlMinutes] = useState(120);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [endingCode, setEndingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchCode, setWatchCode] = useState("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    { playerId: string; username: string }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<
    {
      playerId: string;
      username: string;
      score: number;
      totalTimeMs: number;
      rank: number;
    }[]
  >([]);
  const [quizBank, setQuizBank] = useState<QuizBank | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);
  const [quizFormSaving, setQuizFormSaving] = useState(false);
  const [newRound, setNewRound] = useState("1");
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newNearCorrect, setNewNearCorrect] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newPoints, setNewPoints] = useState(1);
  const [newNearPoints, setNewNearPoints] = useState(0);
  const [newPillar, setNewPillar] = useState("economy");
  const [newConsequenceCorrect, setNewConsequenceCorrect] = useState("");
  const [newConsequenceNear, setNewConsequenceNear] = useState("");
  const [newConsequenceWrong, setNewConsequenceWrong] = useState("");
  const [newRiskPenalty, setNewRiskPenalty] = useState(-1);
  const [newTimeLimitSec, setNewTimeLimitSec] = useState(15);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setSessionsError(data.error || "Không lấy được danh sách phiên.");
      } else {
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch {
      setSessionsError("Lỗi mạng khi tải danh sách phiên.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchQuizBank = async () => {
    setQuizLoading(true);
    setQuizError(null);
    try {
      const res = await fetch("/api/questions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setQuizError(data.error || "Failed to load quiz bank.");
      } else {
        setQuizBank(data);
      }
    } catch {
      setQuizError("Network error while loading quiz bank.");
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchQuizBank();
    const timer = setInterval(fetchSessions, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!code) return;
    let socket: Socket | null = null;
    let active = true;

    const init = async () => {
      const { io } = await import("socket.io-client");
      await fetch("/api/socket");
      socket = io({ path: "/api/socket" });
      socket.emit("session:join", { code, role: "admin" });
      socket.on("lobby:update", (payload: LobbyUpdatePayload) => {
        if (!active) return;
        setParticipants(payload.participants ?? []);
        if (payload.status) setStatus(payload.status);
      });
      socket.on("leaderboard:update", (payload: LeaderboardUpdatePayload) => {
        if (!active) return;
        setLeaderboard(payload.entries ?? []);
      });
      socket.on("session:start", () => {
        if (!active) return;
        setStatus("running");
      });
    };

    init();

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [code]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setCode(null);
    setParticipants([]);
    setLeaderboard([]);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers, ttlMinutes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tạo được phiên.");
      } else {
        setCode(data.code);
        setStatus(data.status);
        fetchSessions();
      }
    } catch {
      setError("Có lỗi mạng, thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = watchCode.trim().toUpperCase();
    if (!trimmed) {
      setError("Vui lòng nhập mã phiên.");
      return;
    }
    setError(null);
    setStatus(null);
    setCode(trimmed);
    setParticipants([]);
    setLeaderboard([]);
  };

  const handleStart = async () => {
    if (!code) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${code}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể start phiên.");
      } else {
        setStatus(data.status);
      }
    } catch {
      setError("Có lỗi mạng, thử lại.");
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async (sessionCode: string) => {
    if (!sessionCode) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Kết thúc phiên ${sessionCode}? Người chơi sẽ bị đưa về trang tham gia.`)
    ) {
      return;
    }
    setEndingCode(sessionCode);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionCode}/end`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể kết thúc phiên.");
      } else {
        if (code === sessionCode) {
          setStatus(data.status);
        }
        fetchSessions();
      }
    } catch {
      setError("Có lỗi mạng, thử lại.");
    } finally {
      setEndingCode(null);
    }
  };

  const handleSelectSession = (sessionCode: string) => {
    setError(null);
    setCode(sessionCode);
    setWatchCode(sessionCode);
    setParticipants([]);
    setLeaderboard([]);
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewOptions((prev) =>
      prev.map((option, idx) => (idx === index ? value : option))
    );
  };

  const handleAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setQuizFormError(null);
    setQuizFormSaving(true);

    const text = newQuestion.trim();
    const options = newOptions.map((option) => option.trim());
    const explanation = newExplanation.trim();
    const consequenceNear = newConsequenceNear.trim();

    if (!text) {
      setQuizFormError("Question text is required.");
      setQuizFormSaving(false);
      return;
    }

    if (options.some((option) => option.length === 0)) {
      setQuizFormError("Please fill in all options.");
      setQuizFormSaving(false);
      return;
    }

    if (newCorrectIndex < 0 || newCorrectIndex >= options.length) {
      setQuizFormError("Correct option is invalid.");
      setQuizFormSaving(false);
      return;
    }

    const parseNearCorrect = (value: string) => {
      const tokens = value
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0);
      const indices = tokens
        .map((token) => {
          const upper = token.toUpperCase();
          if (/^[A-Z]$/.test(upper)) {
            return upper.charCodeAt(0) - 65;
          }
          const numeric = Number(token);
          if (!Number.isFinite(numeric)) return null;
          return numeric >= 1 ? Math.round(numeric - 1) : Math.round(numeric);
        })
        .filter((value): value is number => value !== null);
      const unique = Array.from(new Set(indices));
      return unique.filter(
        (value) => value >= 0 && value < options.length && value !== newCorrectIndex
      );
    };

    const nearCorrect = parseNearCorrect(newNearCorrect);
    const nearPoints =
      Number.isFinite(newNearPoints) && newNearPoints > 0
        ? Math.round(newNearPoints)
        : undefined;

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: newRound,
          text,
          options,
          correctIndex: newCorrectIndex,
          explanation: explanation || undefined,
          points: newPoints,
          nearCorrect: nearCorrect.length ? nearCorrect : undefined,
          nearPoints,
          pillar: newPillar,
          consequenceCorrect: newConsequenceCorrect || undefined,
          consequenceNear: consequenceNear || undefined,
          consequenceWrong: newConsequenceWrong || undefined,
          riskPenalty: newRiskPenalty,
          timeLimitSec: newTimeLimitSec,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuizFormError(data.error || "Failed to add question.");
      } else {
        setNewQuestion("");
        setNewOptions(["", "", "", ""]);
        setNewCorrectIndex(0);
        setNewNearCorrect("");
        setNewExplanation("");
        setNewPoints(1);
        setNewNearPoints(0);
        setNewPillar("economy");
        setNewConsequenceCorrect("");
        setNewConsequenceNear("");
        setNewConsequenceWrong("");
        setNewRiskPenalty(-1);
        setNewTimeLimitSec(15);
        fetchQuizBank();
      }
    } catch {
      setQuizFormError("Network error while saving question.");
    } finally {
      setQuizFormSaving(false);
    }
  };

  const formatRemaining = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const minutes = Math.max(0, Math.round(diff / 60000));
    return `${minutes}p`;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Admin: tạo phiên
        </h1>
        <p className="mt-2 text-slate-600">
          Sinh mã code, gửi cho người chơi. Hiện chỉ cần nhập max người và thời
          gian sống phiên.
        </p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Phiên hiện tại
            </h2>
            <button
              type="button"
              onClick={fetchSessions}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              {sessionsLoading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>

          {sessionsError && (
            <p className="mt-2 text-xs text-rose-600">{sessionsError}</p>
          )}

          {sessions.length === 0 && !sessionsLoading ? (
            <p className="mt-3 text-sm text-slate-500">
              Chưa có phiên đang hoạt động.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.code}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {session.code}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.status} | {session.participantCount}/{session.maxPlayers ?? "-"} | còn {formatRemaining(session.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session.code)}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEndSession(session.code)}
                      disabled={endingCode === session.code}
                      className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800 disabled:opacity-60"
                    >
                      {endingCode === session.code ? "Dang ket thuc..." : "Ket thuc"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleWatch} className="mt-6 space-y-3">
          <label className="text-sm font-semibold text-slate-800">
            Theo dõi leaderboard theo mã phiên
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={watchCode}
              onChange={(e) => setWatchCode(e.target.value)}
              placeholder="Nhập mã phiên (VD: ABC123)"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Theo dõi
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Sẽ cập nhật realtime khi người chơi gửi điểm.
          </p>
        </form>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <label className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Giới hạn người chơi</span>
            <input
              type="number"
              min={2}
              max={500}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Thời gian tồn tại (phút)</span>
            <input
              type="number"
              min={10}
              max={240}
              value={ttlMinutes}
              onChange={(e) => setTtlMinutes(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Đang tạo..." : "Tạo phiên mới"}
          </button>
        </form>

        {code && (
          <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-sm font-medium text-indigo-700">
              Mã phiên: <span className="text-lg font-bold">{code}</span>
            </p>
            <p className="text-sm text-indigo-700">
              Trạng thái: {status ?? "lobby"}
            </p>
            <button
              type="button"
              onClick={handleStart}
              disabled={starting || status === "running" || status === "ended"}
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {starting ? "Đang start..." : "Start phiên"}
            </button>
            <button
              type="button"
              onClick={() => handleEndSession(code)}
              disabled={endingCode === code}
              className="mt-2 w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800 disabled:opacity-60"
            >
              {endingCode === code ? "Dang ket thuc..." : "Ket thuc phien"}
            </button>
          </div>
        )}
        {code && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              Lobby ({participants.length})
            </p>
            {participants.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Chưa có dữ liệu điểm.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {participants.map((p) => (
                  <li key={p.playerId}>{p.username}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {code && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              Leaderboard
            </p>
            {leaderboard.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Chưa có dữ liệu điểm.
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <div className="rounded-xl border border-[#d7c2af] bg-[#fdf4ea] px-3 py-2 text-[13px] text-[#5e4a3d]">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#b48462]">
                    Happy ending
                  </p>
                  <p className="mt-1 text-sm text-[#3b2f2a]">
                    Tất cả người chơi đều nhận lời chúc viên mãn sau hành trình.
                  </p>
                </div>
                {leaderboard.map((entry) => {
                  const isTop = entry.rank <= 3;
                  return (
                    <div
                      key={entry.playerId}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 ${isTop
                        ? "border-[#d5b79a] bg-[#f7eadf] shadow-[0_8px_18px_rgba(124,96,78,0.18)]"
                        : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#5f4636]">
                          #{entry.rank}
                        </span>
                        <span>{entry.username}</span>
                        {isTop && (
                          <span className="rounded-full border border-[#c8a383] bg-[#fdf2e8] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#8a5e3f]">
                            Top {entry.rank}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {entry.score}đ
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <section className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Question bank
            </h2>
            <button
              type="button"
              onClick={fetchQuizBank}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              {quizLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {quizError && (
            <p className="mt-2 text-xs text-rose-600">{quizError}</p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              Round 1: {quizBank?.rounds?.["1"]?.length ?? 0}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              Round 2: {quizBank?.rounds?.["2"]?.length ?? 0}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              Round 3: {quizBank?.rounds?.["3"]?.length ?? 0}
            </div>
          </div>

          <form onSubmit={handleAddQuestion} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Round
              <select
                value={newRound}
                onChange={(e) => setNewRound(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="1">Round 1 - Understanding</option>
                <option value="2">Round 2 - Application</option>
                <option value="3">Round 3 - Competition</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Question
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-2">
              {newOptions.map((option, index) => (
                <input
                  key={`option-${index}`}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex-1 text-xs font-semibold text-slate-700">
                Pillar (for Round 1/2)
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="economy">Economy</option>
                  <option value="politics">Politics</option>
                  <option value="law">Law</option>
                  <option value="culture">Culture / Ethics</option>
                </select>
              </label>
              <label className="w-32 text-xs font-semibold text-slate-700">
                Time limit
                <input
                  type="number"
                  min={5}
                  value={newTimeLimitSec}
                  onChange={(e) => setNewTimeLimitSec(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex-1 text-xs font-semibold text-slate-700">
                Correct option
                <select
                  value={newCorrectIndex}
                  onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  {newOptions.map((_, index) => (
                    <option key={`correct-${index}`} value={index}>
                      Option {String.fromCharCode(65 + index)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="w-32 text-xs font-semibold text-slate-700">
                Points
                <input
                  type="number"
                  min={1}
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="w-32 text-xs font-semibold text-slate-700">
                Risk penalty
                <input
                  type="number"
                  value={newRiskPenalty}
                  onChange={(e) => setNewRiskPenalty(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex-1 text-xs font-semibold text-slate-700">
                Near-correct options (A,B or 1,2)
                <input
                  type="text"
                  value={newNearCorrect}
                  onChange={(e) => setNewNearCorrect(e.target.value)}
                  placeholder="Example: B,C or 2,3"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="w-32 text-xs font-semibold text-slate-700">
                Near points
                <input
                  type="number"
                  min={0}
                  value={newNearPoints}
                  onChange={(e) => setNewNearPoints(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Explanation (optional)
              <textarea
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Consequence when correct (optional)
              <textarea
                value={newConsequenceCorrect}
                onChange={(e) => setNewConsequenceCorrect(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Consequence when near-correct (optional)
              <textarea
                value={newConsequenceNear}
                onChange={(e) => setNewConsequenceNear(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Consequence when wrong (optional)
              <textarea
                value={newConsequenceWrong}
                onChange={(e) => setNewConsequenceWrong(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            {quizFormError && (
              <p className="text-xs text-rose-600">{quizFormError}</p>
            )}

            <button
              type="submit"
              disabled={quizFormSaving}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {quizFormSaving ? "Saving..." : "Add question"}
            </button>
          </form>
        </section>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </main>
  );
}
