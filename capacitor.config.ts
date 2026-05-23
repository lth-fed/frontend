import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'se.teknologappen.tappen',
	appName: 'Tappen',
	webDir: 'build',
	ios: {
		scrollEnabled: true
	},
	plugins: {
		SystemBars: {
			insetsHandling: 'css'
		},
		StatusBar: {
			overlaysWebView: true
		}
	}
};

export default config;
