import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'se.teknologappen.tappen',
	appName: 'Teknologappen',
	webDir: 'build',
	server: {
		errorPath: 'error.html'
	},
	ios: {
		scrollEnabled: true
	},
	plugins: {
		StatusBar: {
			overlaysWebView: true
		},
		SplashScreen: {
			// Held on screen manually (see `+layout.svelte`) until the auth bootstrap
			// settles, so the branded splash bridges straight into the app instead of
			// a blank/"Signing in…" flash between the native launch screen and first paint.
			launchAutoHide: false,
			backgroundColor: '#ffffffff',
			androidSplashResourceName: 'splash',
			showSpinner: false
		}
	}
};

export default config;
