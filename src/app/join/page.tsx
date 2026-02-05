"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const safeCode = code.trim().toUpperCase();
    try {
      const res = await fetch(`/api/sessions/${safeCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Không thể tham gia, thử lại.");
      } else {
        // stash in sessionStorage for quick access
        sessionStorage.setItem(
          "player",
          JSON.stringify({
            playerId: data.playerId,
            username: data.username,
            code: safeCode,
          })
        );
        router.push(`/play/${safeCode}?player=${data.playerId}`);
      }
    } catch {
      setMessage("Có lỗi mạng, thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Tham gia phiên bằng mã
        </h1>
        <p className="mt-2 text-slate-600">
          Nhập mã phiên do admin cấp và username của bạn.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Mã phiên
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg uppercase outline-none ring-indigo-100 focus:border-indigo-500 focus:ring-2"
              placeholder="VD: AB12CD"
              required
              minLength={4}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-lg outline-none ring-indigo-100 focus:border-indigo-500 focus:ring-2"
              placeholder="Tên hiển thị"
              required
              minLength={2}
              maxLength={20}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Đang vào..." : "Tham gia"}
          </button>
          {message && <p className="text-sm text-rose-600">{message}</p>}
        </form>
      </div>
    </main>
  );
}
