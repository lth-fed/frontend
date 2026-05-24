import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
	],
	server: {
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
