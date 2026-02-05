import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white px-6 py-20 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Quiz Arena
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Game quiz 2D. Ng??i ch?i ch? c?n nh?n m? phi?n, nh?p username v? tham
            gia ngay.
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Admin kh?i t?o phi?n, c?p code. Ng??i ch?i nh?p code + username ? v?o
            lobby ch? start. H? th?ng d?ng Supabase Realtime ?? c?p nh?t
            leaderboard theo th?i gian th?c.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/join"
              className="rounded-full bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-700"
            >
              Tham gia b?ng code
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-indigo-200 px-5 py-3 text-indigo-700 transition hover:border-indigo-400"
            >
              T?o phi?n (admin)
            </Link>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Lu?ng ng??i ch?i</h2>
            <ol className="mt-3 space-y-2 text-slate-600">
              <li>1) Nh?p m? phi?n + username ? m?n /join.</li>
              <li>2) Ch? lobby, admin b?m Start.</li>
              <li>3) Tr? l?i c?u h?i, xem ?i?m v? th?i gian.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Lu?ng admin</h2>
            <ol className="mt-3 space-y-2 text-slate-600">
              <li>1) B?m ?T?o phi?n? ?? sinh code.</li>
              <li>2) G?i code cho ng??i ch?i.</li>
              <li>3) Theo d?i lobby v? b?t ??u game.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
