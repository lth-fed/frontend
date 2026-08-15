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
	let active = true;
	let scanning = $state(false);
	let result = $state<ValidationResult | undefined>();
	let error = $state('');

	prepareZXingModule({
		overrides: {
			locateFile: (path: string, prefix: string) =>
				path.endsWith('.wasm') ? zxingWasmUrl : prefix + path
		}
	});

	useAppBars(() => ({ topBar: detailTopBar({ title: m.verifier_title() }), bottom: emptyBottom }));

	async function scan(detector: BarcodeDetector) {
		if (!active || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
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

	onMount(() => {
		const detector = new BarcodeDetector({ formats: ['qr_code'] });
		let timer: ReturnType<typeof setInterval> | undefined;
		void navigator.mediaDevices
			.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
			.then((camera) => {
				stream = camera;
				video.srcObject = camera;
				return video.play();
			})
			.then(() => (timer = setInterval(() => void scan(detector), 300)))
			.catch((cause) => {
				console.error('Camera failed', cause);
				error = m.verifier_camera_error();
			});
		return () => {
			active = false;
			if (timer) clearInterval(timer);
			stream?.getTracks().forEach((track) => track.stop());
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
	</div>

	{#if scanning}<p class="text-center text-sm">{m.verifier_checking()}</p>{/if}
	{#if error}<p class="rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>{/if}
	{#if result}
		<section
			class="rounded-3xl border p-5"
			class:border-green-300={result.verified}
			class:border-red-300={!result.verified}
			class:bg-green-50={result.verified}
			class:bg-red-50={!result.verified}>
			<h2 class="text-xl font-semibold">
				{result.verified ? m.verifier_valid() : m.verifier_rejected()}
			</h2>
			{#if result.verified}
				<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
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
