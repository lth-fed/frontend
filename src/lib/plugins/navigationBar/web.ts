import { WebPlugin } from '@capacitor/core';
import { type NavigationBarPlugin } from './definitions';

export class NavigationBarWeb extends WebPlugin implements NavigationBarPlugin {
	async configure(): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}

	async setTitle(): Promise<void> {
		throw this.unavailable('setTitle is not available on web');
	}

	async setBackButton(): Promise<void> {
		throw this.unavailable('setBackButton is not available on web');
	}

	async setActionButton(): Promise<void> {
		throw this.unavailable('setActionButton is not available on web');
	}
}
