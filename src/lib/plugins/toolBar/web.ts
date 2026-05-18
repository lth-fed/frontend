/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebPlugin } from '@capacitor/core';
import type { ToolBarPlugin, ToolBarConfigureOptions } from './definitions';

export class ToolBarWeb extends WebPlugin implements ToolBarPlugin {
	async configure(options: ToolBarConfigureOptions): Promise<void> {
		throw this.unavailable('configure is not available on web');
	}

	async show(): Promise<void> {
		throw this.unavailable('show is not available on web');
	}

	async hide(): Promise<void> {
		throw this.unavailable('hide is not available on web');
	}
}
