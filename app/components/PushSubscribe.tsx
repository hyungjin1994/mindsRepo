"use client";

import React, { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscribe({ userId }: { userId?: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setStatus('이 기기에서는 알림을 받을 수 없어요.');
    try {
      setStatus('알림을 준비하고 있어요...');
      const reg = await navigator.serviceWorker.register('/sw.js');
      setStatus('알림 허용을 확인하고 있어요...');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setStatus('알림이 허용되지 않았어요. 다시 해주세요.');

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const options: any = { userVisibleOnly: true };
      if (vapidKey) options.applicationServerKey = urlBase64ToUint8Array(vapidKey);

      const sub = await reg.pushManager.subscribe(options);
      const body = { endpoint: sub.endpoint, p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') ?? new ArrayBuffer(0)))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth') ?? new ArrayBuffer(0)))), userAgent: navigator.userAgent };

      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, userId }) });
      if (res.ok) setStatus('알림 받기를 시작했어요.'); else setStatus('알림 설정에 실패했어요. 다시 해주세요.');
    } catch (e) {
      setStatus('알림 설정에 실패했어요. 다시 해주세요.');
    }
  }

  return (
    <div className="mt-4 rounded-lg border bg-white p-4">
      <h4 className="text-lg font-medium">푸시 알림</h4>
      <p className="text-base text-zinc-600">알림을 허용하면 약·일정 알림을 받을 수 있어요.</p>
      <div className="mt-3">
        <button
          aria-label="푸시 알림 구독"
          onClick={subscribe}
          className="min-h-[56px] rounded bg-blue-600 px-4 py-3 text-base text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          푸시 구독
        </button>
        {status && <div className="mt-2 text-base">{status}</div>}
      </div>
    </div>
  );
}
