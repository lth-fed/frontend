import { registerPlugin } from '@capacitor/core';

export interface TicketWalletPlugin {
	/**
	 * Adds a ticket to the phone's wallet.
	 * @param options - Configuration object for adding a ticket
	 * @param options.passData - Base64 encoded data representing the ticket to add
	 * @returns A promise that resolves to an object indicating whether the ticket was successfully added or not
	 */
	addTicket(options: { passData: string }): Promise<{ success: boolean }>;
}

export const ticketWallet = registerPlugin<TicketWalletPlugin>('TicketWallet');
