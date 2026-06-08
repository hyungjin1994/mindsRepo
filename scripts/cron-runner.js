const base = process.env.APP_URL || 'http://localhost:3000';
const path = '/api/cron/reminders';

async function run() {
  console.log('Calling', base + path);
  try {
    const res = await fetch(base + path, { method: 'POST' });
    const j = await res.json().catch(() => ({}));
    console.log('Status', res.status, j?.ok ?? true);
  } catch (e) {
    console.error('Cron runner error', e?.message ?? e);
    process.exitCode = 1;
  }
}

run();
