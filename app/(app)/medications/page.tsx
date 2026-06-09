import Link from "next/link";

export default function MedicationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">💊 약 관리</h1>
      <p className="mt-1.5 text-lg text-zinc-600">복용하는 약과 시간을 관리해요.</p>

      <div className="mt-6 rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        <div aria-hidden="true" className="text-5xl">🛠️</div>
        <h2 className="mt-3 text-2xl font-bold text-zinc-900">곧 준비됩니다</h2>
        <p className="mt-2 text-lg text-zinc-600">
          약 목록과 복용 시간 알림을 여기서 관리할 수 있게 준비하고 있어요.
        </p>
        <p className="mt-2 text-base text-zinc-500">
          그동안 약 먹는 시간은 <b>알림·일정</b>에서 등록해 두세요.
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
