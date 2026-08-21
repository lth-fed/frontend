import { Capacitor } from '@capacitor/core';
import { receiptBlob } from '$lib/api/tickets';
import { receipt } from '$lib/plugins/receipt';

function base64Encode(bytes: Uint8Array): string {
	const chunkSize = 0x8000;
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return btoa(binary);
}

export async function downloadReceipt(ticketId: string): Promise<void> {
	const blob = await receiptBlob(ticketId);
	const filename = `receipt-${ticketId.slice(0, 8)}.pdf`;
	if (Capacitor.getPlatform() === 'android') {
		await receipt.open({
			data: base64Encode(new Uint8Array(await blob.arrayBuffer())),
			filename
		});
		return;
	}

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
