import { WebPlugin } from '@capacitor/core';
import type { TicketWalletPlugin } from './ticketWallet';

export class TicketWalletWeb extends WebPlugin implements TicketWalletPlugin {
    async addTicket(_options: { passData: string }): Promise<{ success: boolean }> {
        throw this.unavailable('addTicket is not available on web');
    }
}
