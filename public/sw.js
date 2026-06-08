/* Service Worker for handling push notifications */
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch (e) {
    data = { title: '알림', body: event.data?.text() ?? '' };
  }

  const title = data.title || '알림';
  const options = {
    body: data.body || '',
    badge: '/favicon.ico',
    icon: '/favicon.ico',
    data: data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
