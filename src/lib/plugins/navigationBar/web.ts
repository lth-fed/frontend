import { WebPlugin } from '@capacitor/core';
import { type NavigationBarPlugin } from './definitions';

/** Web fallback for NavigationBar. */
export class NavigationBarWeb extends WebPlugin implements NavigationBarPlugin {
	/** NavigationBar is not available in the browser. */
	async configure(): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	/** NavigationBar is not available in the browser. */
	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	/** NavigationBar is not available in the browser. */
	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}

	/** NavigationBar is not available in the browser. */
	async setTitle(): Promise<void> {
		throw this.unavailable('setTitle is not available on web');
	}

	/** NavigationBar is not available in the browser. */
	async setBackButton(): Promise<void> {
		throw this.unavailable('setBackButton is not available on web');
	}

	/** NavigationBar is not available in the browser. */
	async setActionButton(): Promise<void> {
		throw this.unavailable('setActionButton is not available on web');
	}
}
