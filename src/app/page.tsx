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
            Game quiz 2D. Người chơi chỉ cần nhận mã phiên, nhập username và
            tham gia ngay.
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Admin khởi tạo phiên, cấp code. Người chơi nhập code + username →
            vào lobby chờ start. Hệ thống sẵn sàng cho realtime scoreboard với
            WebSocket.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/join"
              className="rounded-full bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-700"
            >
              Tham gia bằng code
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-indigo-200 px-5 py-3 text-indigo-700 transition hover:border-indigo-400"
            >
              Tạo phiên (admin)
            </Link>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Luồng người chơi</h2>
            <ol className="mt-3 space-y-2 text-slate-600">
              <li>1) Nhập mã phiên + username ở màn /join.</li>
              <li>2) Chờ lobby, admin bấm Start.</li>
              <li>3) Trả lời câu hỏi, xem điểm và thời gian.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Luồng admin</h2>
            <ol className="mt-3 space-y-2 text-slate-600">
              <li>1) Bấm “Tạo phiên” để sinh code.</li>
              <li>2) Gửi code cho người chơi.</li>
              <li>3) Theo dõi lobby và bắt đầu game.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
