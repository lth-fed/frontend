import { registerPlugin } from '@capacitor/core';

export interface ReceiptPlugin {
	open(options: { data: string; filename: string }): Promise<void>;
}

export const receipt = registerPlugin<ReceiptPlugin>('Receipt', {
	web: () => import('./receipt/web').then((m) => new m.ReceiptWeb())
});
