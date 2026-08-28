import { WebPlugin } from '@capacitor/core';
import type { ReceiptPlugin } from '../receipt';

/** Web fallback for Receipt: triggers a normal browser download via a blob URL. */
export class ReceiptWeb extends WebPlugin implements ReceiptPlugin {
	async open(options: { data: string; filename: string }): Promise<void> {
		const bytes = Uint8Array.from(atob(options.data), (char) => char.charCodeAt(0));
		const blob = new Blob([bytes], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = options.filename;
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 30_000);
	}
}
