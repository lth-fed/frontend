import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';

const gitRevision = (() => {
	try {
		const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
			encoding: 'utf8'
		}).trim();
		const modified = execFileSync('git', ['status', '--porcelain'], {
			encoding: 'utf8'
		}).trim();
		return `${hash}${modified ? '-modified' : ''}`;
	} catch {
		return 'unknown';
	}
})();

export default defineConfig({
	define: {
		__GIT_REVISION__: JSON.stringify(gitRevision)
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// The cookie is not available at cold start in the iOS WKWebView, which made every launch
			// fall back to the base locale. localStorage persists the chosen locale there.
			strategy: ['cookie', 'localStorage', 'globalVariable', 'baseLocale']
		})
	],
	server: {
		port: 5173,
		strictPort: true
	}
});
