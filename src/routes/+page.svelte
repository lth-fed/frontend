<script lang="ts">
	import { ticketWallet } from '$lib/plugins/ticketWallet';

	let errorMessage: string | null = $state(null);
	let successMessage: string | null = $state(null);
	const pkpassFileUrl = '/tickets/event-ticket.pkpass';

	async function addTicketToWallet() {
		try {
			const response = await fetch(pkpassFileUrl);

			if (!response.ok) {
				throw new Error('Failed to fetch the .pkpass file');
			}

			const fileBlob = await response.blob();
			const reader = new FileReader();

			reader.onloadend = async () => {
				const base64Data = reader.result as string;

				const result = await ticketWallet.addTicket({
					passData: base64Data.split(',')[1]
				});

				if (result.success) {
					successMessage = 'Pass successfully added to the wallet!';
				} else {
					errorMessage = 'Failed to add pass to the wallet.';
				}
			};

			reader.onerror = () => {
				errorMessage = 'Error reading the file.';
			};

			reader.readAsDataURL(fileBlob);
		} catch (error) {
			console.error(error);
			errorMessage =
				(error instanceof Error ? error.message : String(error)) ||
				'An error occurred while processing the file.';
		}
	}
</script>

<main>
	<h1>Welcome to Appen Appen</h1>
	<p>Click the button to add the .pkpass pass to your wallet.</p>

	{#if errorMessage}
		<p class="text-red-600">{errorMessage}</p>
	{/if}

	{#if successMessage}
		<p class="text-green-600">{successMessage}</p>
	{/if}

	<button onclick={addTicketToWallet}>Add to Wallet</button>
</main>
