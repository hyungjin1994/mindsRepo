import Link from "next/link";

export default function WorkoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">🏃 운동 기록</h1>
      <p className="mt-1.5 text-lg text-zinc-600">오늘 한 운동을 남기고 지난 기록을 확인해요.</p>

      <div className="mt-6 rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        <div aria-hidden="true" className="text-5xl">🛠️</div>
        <h2 className="mt-3 text-2xl font-bold text-zinc-900">곧 준비됩니다</h2>
        <p className="mt-2 text-lg text-zinc-600">
          아쿠아워킹·헬스 같은 정기 운동과 단발 기록을 여기서 남길 수 있게 준비하고 있어요.
        </p>
        <p className="mt-2 text-base text-zinc-500">
          그동안 운동 일정은 <b>알림·일정</b>에서 등록해 두세요.
        </p>
        <Link
          href="/reminders"
          className="mt-5 inline-flex min-h-[56px] items-center rounded-2xl bg-amber-400 px-6 py-3 text-lg font-bold text-zinc-900 shadow-sm hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        >
          알림·일정으로 가기
        </Link>
      </div>
    </div>
  );
}
