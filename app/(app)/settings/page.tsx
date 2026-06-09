import A11yControls from "../../components/A11yControls";
import PushSubscribe from "../../components/PushSubscribe";

// 설정 — 글자 크기·화면 대비·알림. (상단 바에서 옮겨옴)
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">⚙️ 설정</h1>
      <p className="mt-1.5 text-lg text-zinc-600">화면을 보기 편하게 맞춰보세요.</p>

      <section className="mt-6 rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900">👀 화면 보기</h2>
        <p className="mt-1.5 text-base text-zinc-600">
          글자 크기와 화면 대비를 바꿀 수 있어요. 누르면 바로 적용돼요.
        </p>
        <div className="mt-4">
          <A11yControls />
        </div>
      </section>

      <section className="mt-5">
        <PushSubscribe />
      </section>
    </div>
  );
}
