/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core';
import type { ToolBarPlugin, ToolBarConfigureOptions } from './definitions';

/** Web fallback for ToolBar. */
export class ToolBarWeb extends WebPlugin implements ToolBarPlugin {
	/** ToolBar is not available in the browser. */
	async configure(options: ToolBarConfigureOptions): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	/** ToolBar is not available in the browser. */
	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	/** ToolBar is not available in the browser. */
	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}
}
