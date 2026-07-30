// Dev-only: simulate a Swish "paid" callback so a pending paid purchase
// completes locally without the real Swish app / sandbox.
//
// It fires exactly what Swish's backend would: a POST to the transactions
// service's /v0/swish-callback carrying the pending transaction's id +
// callbackIdentifier and a paymentReference (a present reference is what
// marks it Paid). The purchase then completes through the real callback
// chain — transactions → minilith `/v0/tickets/callback` → reservation
// becomes a ticket — and the app, polling in "Completing payment…",
// flips to purchased within ~5s.
//
// Run it in a terminal while sitting on the paying screen:
//   pnpm dev:swish-pay              (or: node scripts/dev-swish-pay.mjs)
//
// Env overrides (sensible local defaults):
//   TRANSACTIONS_URL   default http://localhost:8002
//   TRANSACTIONS_DB    default transactions62
//   BACKEND_COMPOSE    default ../backend/compose.yaml (for the psql lookup)
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const URL_ = process.env.TRANSACTIONS_URL ?? 'http://localhost:8002';
const DB = process.env.TRANSACTIONS_DB ?? 'transactions62';
const here = dirname(fileURLToPath(import.meta.url));
const COMPOSE = process.env.BACKEND_COMPOSE ?? resolve(here, '../../backend/compose.yaml');

// Pending Swish transactions have no payment_reference yet (free ones
// are stamped 'free' at creation, so they're excluded).
const query = 'select id, callback_identifier from transactions where payment_reference is null';
let rows;
try {
	rows = execSync(
		`docker compose -f "${COMPOSE}" exec -T postgres psql -U postgres -d ${DB} -tAF, -c "${query}"`,
		{ encoding: 'utf8' }
	).trim();
} catch (err) {
	console.error('Could not query the transactions DB. Is the backend stack up?');
	console.error(String(err.stderr ?? err.message).trim());
	process.exit(1);
}

if (!rows) {
	console.log('No pending Swish transactions. Start a paid purchase and press Pay first.');
	process.exit(0);
}

for (const line of rows.split('\n')) {
	const [id, callbackIdentifier] = line.split(',');
	const res = await fetch(`${URL_}/v0/swish-callback`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', callbackIdentifier },
		body: JSON.stringify({ id, paymentReference: 'DEV-SIMULATED', status: 'PAID' })
	});
	console.log(`transaction ${id}: swish-callback → ${res.status}${res.ok ? ' ✓' : ''}`);
	if (!res.ok) console.error('  ', (await res.text()).slice(0, 200));
}
console.log('Done — the app flips to purchased within ~5s (paying poll cadence).');
