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
		strictPort: true,
		// Same-origin pass-through to fed-tickets exclusively so the
		// server-callback URL (lib/auth/bootstrap.ts BACKEND_CALLBACK_V1)
		// passes fed-auth's same-authority check in dev — Origin and the
		// callback URL both resolve to `localhost:5173`, even though the
		// proxy rewrites to :8000. Browser API calls go direct now that
		// fed-tickets ships CORS, so no other paths need to live here.
		proxy: {
			'/_proxy/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/_proxy\/api/, '/v0')
			}
		}
	}
});
