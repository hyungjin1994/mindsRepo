const base = process.env.APP_URL || 'http://localhost:3000';
async function check(path, opts) {
  try {
    const res = await fetch(base + path, opts);
    const j = await res.json().catch(() => ({}));
    console.log(path, res.status, j?.ok ?? true);
  } catch (e) {
    console.error(path, 'error', e.message ?? e);
  }
}

async function run() {
  console.log('Running smoke checks against', base);
  await check('/api/dashboard');
  await check('/api/auth/me');
  await check('/api/family/feed');
  await check('/api/reminders');
  await check('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'test', body: 'hi' }) });
}

run();
