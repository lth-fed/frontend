/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core';
import type {
	TabsBarPlugin,
	TabsBarConfigureOptions,
	SelectOptions,
	SetBadgeOptions,
	SafeAreaInsets
} from './definitions';

export class TabsBarWeb extends WebPlugin implements TabsBarPlugin {
	async configure(options: TabsBarConfigureOptions): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}

	async select(options: SelectOptions): Promise<void> {
		throw this.unavailable('select is not available on web');
	}

	async setBadge(options: SetBadgeOptions): Promise<void> {
		throw this.unavailable('setBadge is not available on web');
	}

	async getSafeAreaInsets(): Promise<SafeAreaInsets> {
		throw this.unavailable('getSafeAreaInsets is not available on web');
	}
}
