"use client";

import React from "react";

export default function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold">간단 사용법</h2>
        <ul className="mt-3 space-y-3 text-lg text-zinc-700">
          <li>1. 추천 게임의 '시작'을 눌러 문제를 풀어보세요.</li>
          <li>2. 알림(약·운동)은 완료 시 '완료' 버튼을 눌러 표시합니다.</li>
          <li>3. 가족이 보낸 사진은 탭하면 크게 볼 수 있습니다.</li>
          <li>4. 글자 크기는 아래 슬라이더로 조절하세요.</li>
          <li>5. 문제가 생기면 '도움말'에서 가족에게 연락하세요.</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            aria-label="도움말 닫기"
            className="min-h-[56px] rounded bg-zinc-100 px-4 py-3 text-base hover:bg-zinc-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
