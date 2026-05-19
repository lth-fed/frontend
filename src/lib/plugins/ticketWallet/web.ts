import { WebPlugin } from '@capacitor/core';
import type { TicketWalletPlugin } from './ticketWallet';

/** Web fallback for TicketWallet. */
export class TicketWalletWeb extends WebPlugin implements TicketWalletPlugin {
	/** TicketWallet is not available in the browser. */
	async addTicket(_options: { passData: string }): Promise<{ success: boolean }> {
		throw this.unavailable('addTicket is not available on web');
	}
}
