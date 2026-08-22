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
		}
	}
};

export default config;
