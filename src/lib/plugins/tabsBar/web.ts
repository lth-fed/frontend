/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core';
import type {
	TabsBarPlugin,
	TabsBarConfigureOptions,
	SelectOptions,
	SetBadgeOptions,
	SafeAreaInsets
} from './definitions';

/** Web fallback for TabsBar. */
export class TabsBarWeb extends WebPlugin implements TabsBarPlugin {
	/** TabsBar is not available in the browser. */
	async configure(options: TabsBarConfigureOptions): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	/** TabsBar is not available in the browser. */
	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	/** TabsBar is not available in the browser. */
	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}

	/** TabsBar is not available in the browser. */
	async select(options: SelectOptions): Promise<void> {
		throw this.unavailable('select is not available on web');
	}

	/** TabsBar is not available in the browser. */
	async setBadge(options: SetBadgeOptions): Promise<void> {
		throw this.unavailable('setBadge is not available on web');
	}

	/** TabsBar is not available in the browser. */
	async getSafeAreaInsets(): Promise<SafeAreaInsets> {
		throw this.unavailable('getSafeAreaInsets is not available on web');
	}
}
