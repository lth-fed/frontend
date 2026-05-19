/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core';
import { type NativeButtonConfig, type NativeButtonPlugin } from './definitions';

/** Web fallback for NativeButton. */
export class NativeButtonWeb extends WebPlugin implements NativeButtonPlugin {
	/** Native buttons are not available in the browser. */
	configure(options: NativeButtonConfig): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	/** Native buttons are not available in the browser. */
	hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}

	/** Native buttons are not available in the browser. */
	show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}
}
