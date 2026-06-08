// Simple script to trigger the reminders send endpoint on a running dev server
const url = process.env.APP_URL || 'http://localhost:3000';
async function run() {
  try {
    const res = await fetch(`${url}/api/reminders/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const j = await res.json();
    console.log('response', j);
  } catch (e) {
    console.error('error', e);
  }
}

run();
