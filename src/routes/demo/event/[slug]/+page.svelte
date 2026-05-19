<script lang="ts">
	import {
		CalendarIcon,
		ChevronLeft,
		HexagonIcon,
		MapPinIcon,
		ShareIcon,
		TicketIcon
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { navigationBar } from '$lib/plugins/navigationBar/navigationBar';
	import { nativeButton } from '$lib/plugins/nativeButton/nativeButton';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';

	let isIos26Native = $state(false);

	onMount(() => {
		void (async () => {
			isIos26Native = await isIos26Plus();
			console.log('Is iOS 26+ platform:', isIos26Native);

			if (!isIos26Native) {
				return;
			}

			navigationBar.configure({
				backButton: {
					id: 'back',
					style: 'plain',
					systemIcon: 'chevron.left'
				},
				actionButton: {
					id: 'action',
					style: 'plain',
					systemIcon: 'square.and.arrow.up'
				},
				title: 'Event Details',
				visible: true
			});

			nativeButton.configure({
				id: 'demo-button',
				title: 'Buy Tickets',
				edge: 'bottom',
				style: 'prominentGlass',
				fullWidth: true,
				systemIcon: 'ticket',
				fontWeight: 'semibold',
				visible: true,
				enabled: true,
				scrollEdgeEffect: true,
				backgroundColor: '#9c6114',
				foregroundColor: '#ffffff'
			});

			navigationBar.addListener('navigationBarAction', (event) => {
				if (event.type === 'back') {
					history.back();
					navigationBar.hide();
					nativeButton.hide();
				}

				if (event.type === 'action') {
					alert('Share button pressed!');
				}
			});

			nativeButton.addListener('tap', (event) => {
				if (event.id === 'demo-button') {
					alert('Buy Tickets button pressed!');
				}
			});
		})();
	});
</script>

{#if !isIos26Native}
	<div class="fixed top-0 z-20 flex w-full justify-between px-4 py-3">
		<button
			class="flex size-11 items-center justify-center rounded-full border border-gray-100 bg-white/80 py-1.25 pr-1.5 pl-1 shadow-[0_8px_40px_color-mix(in_srgb,var(--color-guild-primary)_12%,transparent)] backdrop-blur-xs transition-transform duration-100 active:scale-120 active:bg-gray-100/80"
			onclick={history.back}
		>
			<ChevronLeft class="size-full text-black" />
		</button>
		<button
			class="flex size-11 items-center justify-center rounded-full border border-gray-100 bg-white/80 p-1.25 shadow-[0_8px_40px_color-mix(in_srgb,var(--color-guild-primary)_12%,transparent)] backdrop-blur-xs transition-transform duration-100 active:scale-120 active:bg-gray-100/80"
		>
			<ShareIcon class="size-5.5 text-black" />
		</button>
	</div>

	<div
		class="fixed bottom-0 z-20 flex w-full justify-center px-6.25 pb-[env(safe-area-inset-bottom)]"
	>
		<button
			class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-guild-on-primary shadow-[0_8px_40px_color-mix(in_srgb,rgb(0_0_0)_12%,transparent)]"
		>
			<div class="flex items-center justify-center gap-3">
				<TicketIcon class="size-6 text-guild-on-primary" />
				<span class="text-base font-semibold">Buy Tickets</span>
			</div>
		</button>
	</div>
{/if}

<div class="-mt-[env(safe-area-inset-top)]">
	<img class="z-0 aspect-video h-75" src="https://picsum.photos/300/533" alt="Event" />
	<div
		class="z-10 -mt-24 flex w-full flex-col gap-8.75 px-4 pb-[calc(72px+env(safe-area-inset-bottom))]"
	>
		<div
			class="flex w-full flex-col gap-5 rounded-[34px] bg-white/80 px-6 pt-6 pb-7 shadow-[0_8px_40px_color-mix(in_srgb,var(--color-guild-primary)_12%,transparent)] backdrop-blur-md"
		>
			<div
				class="w-fit rounded-full bg-white px-2 py-1.5 text-[10px] font-semibold text-guild-on-surface"
			>
				PUB
			</div>
			<h1 class="text-[26px] font-bold">Coolt eventnamn</h1>
			<div class="flex flex-col gap-3 pt-1">
				<div class="flex items-center gap-2.5">
					<CalendarIcon class="size-6 text-guild-on-surface" />
					<div class="flex flex-col gap-0.5">
						<span class="text-sm leading-tight font-semibold">Friday, 25 Apr</span>
						<span class="text-xs font-normal text-gray-600">17:00 - 23:00</span>
					</div>
				</div>
				<div class="flex items-center gap-2.5">
					<MapPinIcon class="size-6 text-guild-on-surface" />
					<span class="text-sm leading-tight font-semibold">iDét, E-huset</span>
				</div>
			</div>
		</div>

		<div class="flex w-full flex-col gap-3.75">
			<h2 class="text-[24px] font-semibold">About</h2>
			<p class="text-[16px] font-normal">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris nisi ut aliquip ex ea commodo consequat.
				<br /><br />
				Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
				Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
				id est laborum.
			</p>
		</div>

		<div class="flex w-full flex-col gap-3.75">
			<h2 class="text-[24px] font-semibold">Organiser</h2>
			<div class="flex w-full flex-col gap-2">
				{#snippet organiserCard(guildName: string)}
					<div
						class="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
					>
						<HexagonIcon class="size-10 text-guild-primary" />
						<span class="w-full text-[16px] font-medium">{guildName}</span>
						<span class="text-sm font-semibold text-guild-on-surface">Follow</span>
					</div>
				{/snippet}

				{@render organiserCard('D-sektionen')}
				{@render organiserCard('F-sektionen')}
			</div>
		</div>

		<div class="flex w-full flex-col gap-3.75">
			<div class="flex items-center justify-between">
				<h2 class="text-[24px] font-semibold">Location</h2>
				<span class="text-sm font-semibold text-guild-on-surface">Open Maps</span>
			</div>
			<div class="w-full rounded-3xl border border-gray-100">
				<img
					class="aspect-video w-full rounded-3xl object-cover"
					src="https://picsum.photos/600/400"
					alt="Location"
				/>
			</div>
		</div>
	</div>
</div>
