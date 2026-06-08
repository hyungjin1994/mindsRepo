"use client";

import { useEffect, useState } from "react";

export default function PushSubscriber() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  async function subscribe() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError('알림 설정이 준비되지 않았어요. 다시 해주세요.');
        return;
      }

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const keys = (sub as any).toJSON?.().keys ?? {};
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: (sub as any).endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: navigator.userAgent }) });
      if (res.ok) {
        setSubscribed(true);
      } else {
        setError('알림 설정에 실패했어요. 다시 해주세요.');
      }
    } catch (e) {
      console.error(e);
      setError('알림 설정에 실패했어요. 다시 해주세요.');
    }
  }

  if (!supported) return null;

  return (
    <div>
      {subscribed ? (
        <div className="text-base text-zinc-500">알림을 받고 있어요</div>
      ) : (
        <>
          <button
            aria-label="푸시 알림 구독"
            onClick={subscribe}
            className="min-h-[56px] rounded border px-4 py-3 text-base hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            푸시 구독
          </button>
          {error && <div className="mt-2 text-base text-red-600">{error}</div>}
        </>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
