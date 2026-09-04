export const network = $state({ online: true });

/** Keep a reactive view of the browser's coarse network availability. */
export function monitorNetwork(onReconnect?: () => void): () => void {
	network.online = navigator.onLine;
	const handleOnline = () => {
		network.online = true;
		onReconnect?.();
	};
	const handleOffline = () => (network.online = false);
	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);
	return () => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	};
}
