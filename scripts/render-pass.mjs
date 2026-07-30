// Cross-engine render pass: drives the real app (login via the test provider,
// every screen, full-page screenshots) in Brave, Firefox and WebKit.
//
// Prereqs: backend on :8000 (seeded via seed-dev) and :8001, `pnpm dev` on :5173.
// Usage:   node scripts/render-pass.mjs [--engine brave|firefox|webkit] [--out DIR]
//
// Exit code is non-zero if any page threw or any request failed, so this can
// gate CI later. Screenshots land in <out>/<engine>/, findings in <out>/report.json.

import { chromium, firefox, webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BRAVE = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const BASE = 'http://localhost:5173';
const STIL_ID = 'si1234mc-s'; // seed-dev user (guild: D)
const FULL_NAME = 'Simon Mechler';

const args = process.argv.slice(2);
const argOf = (flag) => {
	const i = args.indexOf(flag);
	return i === -1 ? undefined : args[i + 1];
};
const outRoot = argOf('--out') ?? 'render-pass-output';
const only = argOf('--engine');

const engines = {
	brave: () => chromium.launch({ executablePath: BRAVE }),
	firefox: () => firefox.launch(),
	webkit: () => webkit.launch()
};

const report = {};

async function shoot(page, dir, findings, name, { fullPage = true } = {}) {
	await page.waitForLoadState('networkidle').catch(() => {});
	await page.waitForTimeout(400);
	await page.screenshot({ path: join(dir, `${name}.png`), fullPage });
	findings.push({ screen: name, url: page.url() });
}

async function runEngine(engineName) {
	const dir = join(outRoot, engineName);
	await mkdir(dir, { recursive: true });
	const findings = [];
	const problems = [];
	const browser = await engines[engineName]();
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 2,
		reducedMotion: 'reduce',
		baseURL: BASE
	});
	const page = await context.newPage();
	page.on('pageerror', (err) =>
		problems.push({ kind: 'pageerror', url: page.url(), message: `${err}` })
	);
	page.on('console', (msg) => {
		if (msg.type() !== 'error') return;
		// "Failed to load resource" duplicates the typed `http NNN` entries
		// from the response handler below — real failures still surface there.
		if (/^Failed to load resource/.test(msg.text())) return;
		problems.push({ kind: 'console.error', url: page.url(), message: msg.text() });
	});
	page.on('requestfailed', (req) => {
		const message = req.failure()?.errorText ?? '';
		// Vite dev-server module churn: HMR-invalidated module requests get
		// aborted mid-flight on the first load after an edit. Not app bugs.
		const viteModule = /localhost:5173\/(src|\.svelte-kit|node_modules)\//.test(req.url());
		if (viteModule && message.includes('ERR_ABORTED')) return;
		problems.push({ kind: 'requestfailed', url: req.url(), message });
	});
	page.on('response', (resp) => {
		if (resp.status() < 400) return;
		// 404 on GET /tickets/queue is the contract for "not queued" —
		// the purchase machine probes it on every boot (spec §4.2).
		if (
			resp.status() === 404 &&
			resp.request().method() === 'GET' &&
			new URL(resp.url()).pathname.endsWith('/tickets/queue')
		)
			return;
		problems.push({
			kind: `http ${resp.status()}`,
			url: resp.url(),
			message: resp.request().method()
		});
	});

	try {
		// 1. Landing (pre-auth)
		await page.goto('/');
		await shoot(page, dir, findings, '01-landing');

		// 2. Login via the test provider (full OIDC code+PKCE round trip)
		await page.getByRole('button', { name: 'Log in' }).click();
		await page.waitForURL(/localhost:8001\/providers\/test/, { timeout: 15000 });
		await shoot(page, dir, findings, '02-auth-test-provider');
		await page.locator('input[placeholder="aa0000bb-s"]').fill(STIL_ID);
		await page.locator('input[placeholder="Full name"]').fill(FULL_NAME);
		await page.getByRole('button', { name: 'Log in' }).click();
		await page.waitForURL(/localhost:5173\/home\//, { timeout: 20000 });
		await shoot(page, dir, findings, '03-home');

		// 3. Tabs
		for (const [name, path] of [
			['04-links', '/links/'],
			['05-profile', '/profile/'],
			['06-settings', '/settings/'],
			['06b-about', '/settings/about/']
		]) {
			await page.goto(path);
			await shoot(page, dir, findings, name);
		}

		// 4. Activity detail + tickets (first card from the seeded list)
		await page.goto('/home/');
		await page.waitForLoadState('networkidle').catch(() => {});
		const detailHref = await page.locator('a[href*="/activity/"]').first().getAttribute('href');
		if (detailHref) {
			await page.goto(detailHref);
			await shoot(page, dir, findings, '07-activity-detail');
			await page.goto(detailHref.replace(/\/$/, '') + '/tickets/');
			await shoot(page, dir, findings, '08-activity-tickets');
		} else {
			problems.push({
				kind: 'missing',
				url: page.url(),
				message: 'no activity card found on home'
			});
		}

		// 5. Component gallery
		await page.goto('/demo/components/');
		await shoot(page, dir, findings, '09-components');
	} catch (err) {
		problems.push({ kind: 'fatal', url: page.url(), message: `${err}` });
		await page.screenshot({ path: join(dir, 'ZZ-failure.png'), fullPage: true }).catch(() => {});
	} finally {
		await browser.close();
	}
	report[engineName] = { findings, problems };
	const bad = problems.length;
	console.log(`[${engineName}] ${findings.length} screens, ${bad} problem(s)`);
	for (const p of problems) console.log(`  [${engineName}] ${p.kind} @ ${p.url}: ${p.message}`);
}

const list = only ? [only] : Object.keys(engines);
for (const engine of list) await runEngine(engine);

await writeFile(join(outRoot, 'report.json'), JSON.stringify(report, null, '\t'));
const total = Object.values(report).reduce((n, r) => n + r.problems.length, 0);
console.log(`report: ${join(outRoot, 'report.json')} — ${total} total problem(s)`);
process.exit(total > 0 ? 1 : 0);
