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
	await receipt.open({
		data: base64Encode(new Uint8Array(await blob.arrayBuffer())),
		filename
	});
}
