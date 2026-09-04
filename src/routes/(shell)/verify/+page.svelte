<script lang="ts">
	import { onMount } from 'svelte';
	import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill';
	import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
	import type { PageProps } from './$types';
	import { parseTicketQrPayload, validateTicket, type ValidationResult } from '$lib/api/validation';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { formatShortDateTime } from '$lib/format/datetime';

	let { data }: PageProps = $props();
	let video: HTMLVideoElement;
	let stream: MediaStream | undefined;
	let detector: BarcodeDetector | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let active = true;
	let scanning = $state(false);
	let result = $state<ValidationResult | undefined>();
	let error = $state('');
	let cameras = $state<MediaDeviceInfo[]>([]);
	let selectedCameraIndex = $state(0);
	let changingCamera = $state(false);
	const CAMERA_STORAGE_KEY = 'tappen-verifier-camera-device-id';

	prepareZXingModule({
		overrides: {
			locateFile: (path: string, prefix: string) =>
				path.endsWith('.wasm') ? zxingWasmUrl : prefix + path
		}
	});

	useAppBars(() => ({ topBar: detailTopBar({ title: m.verifier_title() }), bottom: emptyBottom }));

	async function scan() {
		if (!detector || !active || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
			return;
		try {
			const [barcode] = await detector.detect(video);
			if (!barcode || scanning || result) return;
			const payload = parseTicketQrPayload(barcode.rawValue);
			if (!payload) {
				error = m.verifier_invalid_qr();
				return;
			}
			scanning = true;
			error = '';
			const response = await validateTicket(payload);
			if (response.badRequest) error = response.badRequest.message;
			else result = response.ok;
		} catch (cause) {
			console.debug('QR frame could not be decoded', cause);
		} finally {
			scanning = false;
		}
	}

	function reset() {
		result = undefined;
		error = '';
	}

	function stopCamera(): void {
		stream?.getTracks().forEach((track) => track.stop());
		stream = undefined;
	}

	function savedCameraId(): string | undefined {
		try {
			return localStorage.getItem(CAMERA_STORAGE_KEY) ?? undefined;
		} catch {
			return undefined;
		}
	}

	function saveCameraId(deviceId: string | undefined): void {
		if (!deviceId) return;
		try {
			localStorage.setItem(CAMERA_STORAGE_KEY, deviceId);
		} catch {
			// Camera selection still works when storage is unavailable.
		}
	}

	async function startCamera(deviceId?: string): Promise<boolean> {
		stopCamera();
		try {
			const camera = await navigator.mediaDevices.getUserMedia({
				video: deviceId
					? { deviceId: { exact: deviceId } }
					: { facingMode: { ideal: 'environment' } },
				audio: false
			});
			stream = camera;
			video.srcObject = camera;
			await video.play();
			cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
				(device) => device.kind === 'videoinput'
			);
			const activeDeviceId = camera.getVideoTracks()[0]?.getSettings().deviceId;
			const index = cameras.findIndex((camera) => camera.deviceId === activeDeviceId);
			selectedCameraIndex = index >= 0 ? index : 0;
			saveCameraId(activeDeviceId);
			error = '';
			return true;
		} catch (cause) {
			console.error('Camera failed', cause);
			error = m.verifier_camera_error();
			return false;
		}
	}

	async function startPreferredCamera(): Promise<void> {
		const savedDeviceId = savedCameraId();
		if (savedDeviceId && (await startCamera(savedDeviceId))) return;
		await startCamera();
	}

	async function cycleCamera(): Promise<void> {
		if (cameras.length < 2 || changingCamera) return;
		changingCamera = true;
		try {
			const next = (selectedCameraIndex + 1) % cameras.length;
			await startCamera(cameras[next].deviceId);
		} finally {
			changingCamera = false;
		}
	}

	onMount(() => {
		detector = new BarcodeDetector({ formats: ['qr_code'] });
		void startPreferredCamera().then(() => (timer = setInterval(() => void scan(), 300)));
		return () => {
			active = false;
			if (timer) clearInterval(timer);
			stopCamera();
		};
	});
</script>

<div class="flex flex-col gap-4 px-4">
	<p class="text-sm text-guild-on-surface/70">
		{m.verifier_activities({
			activities: data.activities.map((activity) => activity.title).join(', ')
		})}
	</p>
	<div class="relative aspect-square overflow-hidden rounded-3xl bg-black">
		<video bind:this={video} muted playsinline class="size-full object-cover"></video>
		<div class="pointer-events-none absolute inset-[15%] rounded-3xl border-4 border-white/80">
		</div>
		{#if cameras.length > 1}
			<button
				type="button"
				onclick={() => void cycleCamera()}
				disabled={changingCamera}
				class="absolute top-3 right-3 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
				>{m.verifier_switch_camera()}</button>
		{/if}
	</div>

	{#if scanning}<p class="text-center text-sm">{m.verifier_checking()}</p>{/if}
	{#if error}<p class="rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>{/if}
	{#if result}
		<section
			class="rounded-3xl border p-5"
			class:border-green-600={result.verified && result.previousVerifications.length === 0}
			class:bg-green-200={result.verified && result.previousVerifications.length === 0}
			class:border-yellow-500={result.previousVerifications.length > 0}
			class:bg-yellow-100={result.previousVerifications.length > 0}
			class:border-red-300={!result.verified && result.previousVerifications.length === 0}
			class:bg-red-50={!result.verified && result.previousVerifications.length === 0}>
			<h2 class="text-xl font-semibold">
				{result.verified ? m.verifier_valid() : m.verifier_rejected()}
			</h2>
			{#if result.verified}
				<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
					<dt class="font-semibold">{m.verifier_ticket_kind()}</dt>
					<dd>{result.ticketKindName}</dd>
					{#if result.ownerName || result.ownerId}
						<dt class="font-semibold">{m.verifier_owner()}</dt>
						<dd class="min-w-0">
							{#if result.ownerName}<span class="block">{result.ownerName}</span>{/if}
							{#if result.ownerId}<span class="block break-all opacity-70">{result.ownerId}</span
								>{/if}
						</dd>
					{/if}
					{#if result.purchaserName}
						<dt class="font-semibold">{m.verifier_purchaser()}</dt>
						<dd>{result.purchaserName}</dd>
					{/if}
					<dt class="font-semibold">{m.verifier_transfer_status()}</dt>
					<dd>
						{result.hasBeenTransferred ? m.verifier_transferred() : m.verifier_not_transferred()}
					</dd>
					{#if result.purchasedAddons.length}
						<dt class="font-semibold">{m.verifier_addons()}</dt>
						<dd>
							<ul class="space-y-1">
								{#each result.purchasedAddons as addon (addon.name)}
									<li>
										<span>{addon.name}</span>
										{#if addon.selectedOptionNames.length}
											<ul class="ml-4 list-disc">
												{#each addon.selectedOptionNames as option (`${addon.name}-${option}`)}
													<li>{option}</li>
												{/each}
											</ul>
										{/if}
									</li>
								{/each}
							</ul>
						</dd>
					{/if}
				</dl>
			{/if}
			{#if result.previousVerifications.length}
				<p class="mt-3 text-sm font-semibold">{m.verifier_previous()}</p>
				<ul class="mt-1 text-sm opacity-75">
					{#each result.previousVerifications as at, index (`${at.toISOString()}-${index}`)}<li>
							{formatShortDateTime(at)}
						</li>{/each}
				</ul>
			{/if}
			<button
				type="button"
				onclick={reset}
				class="mt-4 w-full rounded-full bg-black px-5 py-3 font-semibold text-white"
				>{m.verifier_scan_next()}</button>
		</section>
	{/if}
</div>
