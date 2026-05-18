<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import LinkCard from '$lib/components/LinkCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import TicketDetail from '$lib/components/TicketDetail.svelte';
	import ToolBar from '$lib/components/ToolBar.svelte';
	import {
		Home,
		Bell,
		IdCard,
		Settings,
		Ticket as TicketIcon,
		ArrowLeftRight,
		Wallet,
		Receipt,
		PartyPopper
	} from '@lucide/svelte';
	import type { Guild } from '$lib/types/guild';

	const themes: { key: Guild | null; label: string }[] = [
		{ key: null, label: 'Neutral' },
		{ key: 'f', label: 'F' },
		{ key: 'e', label: 'E' },
		{ key: 'm', label: 'M' },
		{ key: 'v', label: 'V' },
		{ key: 'a', label: 'A' },
		{ key: 'k', label: 'K' },
		{ key: 'd', label: 'D' },
		{ key: 'ing', label: 'Ing' },
		{ key: 'w', label: 'W' },
		{ key: 'i', label: 'I' }
	];

	let current = $state<Guild | null>('f');

	type NavId = 'home' | 'alerts' | 'profile' | 'settings';
	const navItems = [
		{ id: 'home' as NavId, icon: Home, label: 'Home' },
		{ id: 'alerts' as NavId, icon: Bell, label: 'Alerts' },
		{ id: 'profile' as NavId, icon: IdCard, label: 'Profile' },
		{ id: 'settings' as NavId, icon: Settings, label: 'Settings' }
	];
	let selectedNav = $state<NavId>('home');

	type ToolId = 'transfer' | 'wallet' | 'receipt' | 'event';
	const toolItems = [
		{ id: 'transfer' as ToolId, icon: ArrowLeftRight, label: 'Transfer' },
		{ id: 'wallet' as ToolId, icon: Wallet, label: 'Add to wallet' },
		{ id: 'receipt' as ToolId, icon: Receipt, label: 'View receipt' },
		{ id: 'event' as ToolId, icon: PartyPopper, label: 'View event' }
	];

	const demoEvents = [
		{
			image: 'https://picsum.photos/seed/event-a/640/360',
			badge: 'SITTNING',
			date: 'Mon, Apr 27 - 17:00',
			title: 'Annan sittning typ',
			priceFrom: 120,
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			location: 'Gasque-salen'
		},
		{
			image: 'https://picsum.photos/seed/event-b/640/360',
			badge: 'FEST',
			date: 'Fri, May 01 - 21:00',
			title: 'Vårfest',
			priceFrom: 80,
			description:
				'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
			location: 'Kårhuset'
		},
		{
			image: 'https://picsum.photos/seed/event-c/640/360',
			badge: 'PUB',
			date: 'Tue, May 05 - 18:00',
			title: 'Tisdagspub',
			priceFrom: 40,
			description:
				'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
			location: 'Pub-lokalen'
		}
	];

	const demoTickets = [
		{
			name: 'Simon Mechler',
			title: 'Cool sittning typ',
			subtitle: 'Guild demo',
			date: '25 Apr, 2026',
			time: '17:00 - 23:00',
			location: 'Kan inga lokaler',
			addition: 'Wine Package +1',
			serial: '#XX-6719284'
		},
		{
			name: 'Simon Mechler',
			title: 'Annan sittning typ',
			subtitle: 'Guild demo',
			date: '27 Apr, 2026',
			time: '17:00 - 23:00',
			location: 'Gasque-salen',
			addition: 'Standard',
			serial: '#XX-6719285'
		},
		{
			name: 'Simon Mechler',
			title: 'Tredje sittning',
			subtitle: 'Guild demo',
			date: '29 Apr, 2026',
			time: '18:00 - 00:00',
			location: 'Kårhuset',
			addition: 'VIP',
			serial: '#XX-6719286'
		}
	];
</script>

<main class="h-screen overflow-y-auto bg-gray-100 p-8">
	<h1 class="mb-4 text-2xl font-bold">Components</h1>

	<div class="mb-8 flex flex-wrap gap-2">
		{#each themes as t (t.key ?? 'neutral')}
			<button
				type="button"
				onclick={() => (current = t.key)}
				data-guild={t.key ?? undefined}
				class="rounded-full px-4 py-1.5 text-sm font-bold {current === t.key
					? 'bg-guild-primary text-guild-on-primary ring-2 ring-guild-ring'
					: 'bg-guild-surface text-guild-on-surface'}"
			>
				{t.label}
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap items-start gap-10 pb-12" data-guild={current ?? undefined}>
		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">Ticket</p>
			<Ticket
				name="Simon Mechler"
				title="Cool sittning typ"
				subtitle="Guild demo"
				date="25 Apr, 2026"
				time="17:00 - 23:00"
				location="Kan inga lokaler"
				addition="Wine Package +1"
				serial="#XX-6719284"
				onAction={(id) => alert(`Action: ${id}`)}
			/>
		</section>

		<section class="w-full space-y-3">
			<p class="text-sm font-bold text-gray-600">Long titles</p>
			<div class="flex flex-wrap items-start gap-6">
				<Ticket
					name="Simon Mechler"
					title="Vårfestssittning med temat årets största händelse 2026"
					subtitle="F-sektionen"
					date="25 Apr, 2026"
					time="17:00 - 23:00"
					location="Kan inga F-lokaler"
					addition="Wine Package +1"
					serial="#FG-6719284"
				/>
				<div class="w-[360px]">
					<EventCard
						image="https://picsum.photos/seed/long-title/640/360"
						badge="SITTNING"
						date="Mon, Apr 27 - 17:00"
						title="Vårens stora avslutningssittning för F-sektionen och vänner"
						priceFrom={120}
						description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
						location="Gasque-salen"
					/>
				</div>
			</div>
		</section>

		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">QrCode (placeholder)</p>
			<QrCode data="#FG-6719284" />
		</section>

		<section class="w-full max-w-[320px] space-y-3">
			<p class="text-sm font-bold text-gray-600">TicketDetail</p>
			<TicketDetail
				name="Simon Mechler"
				event="Vinterbal"
				serial="#FG-6719284"
				qrData="#FG-6719284"
			/>
		</section>

		<section class="w-full max-w-[320px] space-y-3">
			<p class="text-sm font-bold text-gray-600">TicketDetail — long</p>
			<TicketDetail
				name="Maximilianus Karlsson-Andersson"
				event="Inskrivningssittningskommittéens vårfest"
				serial="#FG-6719284"
				qrData="#FG-6719284"
			/>
		</section>

		<section class="w-full max-w-[400px] space-y-3">
			<p class="text-sm font-bold text-gray-600">TopBar</p>
			<div class="rounded-2xl bg-guild-surface">
				<TopBar
					initials="SM"
					onAvatarClick={() => alert('Account')}
					onNotificationsClick={() => alert('Notifications')}
				/>
			</div>
		</section>

		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">NavBar</p>
			<NavBar items={navItems} selected={selectedNav} onSelect={(id) => (selectedNav = id)} />
		</section>

		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">ToolBar</p>
			<ToolBar items={toolItems} onAction={(id) => alert(`Action: ${id}`)} />
		</section>

		<section class="w-full max-w-[400px] space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — tickets (click to open)</p>
			<Carousel items={demoTickets}>
				{#snippet item(t)}
					<Ticket {...t} onAction={(id) => alert(`Action: ${id}`)} />
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-[400px] space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — empty</p>
			<Carousel items={[] as unknown[]}>
				{#snippet item(_)}{/snippet}
				{#snippet empty()}
					<EmptyState
						icon={TicketIcon}
						title="Your tickets will appear here"
						cta={{ label: 'Kanske en CTA här?', onclick: () => alert('CTA clicked') }}
					/>
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-[400px] space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — events</p>
			<Carousel items={demoEvents}>
				{#snippet item(e)}
					<div class="w-[320px]">
						<EventCard {...e} onclick={() => alert(`Event: ${e.title}`)} />
					</div>
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-[400px] space-y-3">
			<p class="text-sm font-bold text-gray-600">LinkCard</p>
			<LinkCard
				image="https://picsum.photos/seed/linkcard-a/240/240"
				title="F-sektionen"
				description="Officiell hemsida för Fysiksektionen vid LTH."
				url="https://www.f.kth.se"
			/>
			<LinkCard
				image="https://picsum.photos/seed/linkcard-b/240/240"
				title="Vårens stora avslutningssittning för F-sektionen och vänner"
				description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."
				url="https://example.com"
			/>
		</section>

		<section class="w-full max-w-[360px] space-y-3">
			<p class="text-sm font-bold text-gray-600">EventCard</p>
			<EventCard
				image="https://picsum.photos/seed/sittning/640/360"
				badge="SITTNING"
				date="Mon, Apr 27 - 17:00"
				title="Annan sittning typ"
				priceFrom={120}
				description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
				location="Gasque-salen"
				onclick={() => alert('Event clicked')}
			/>
		</section>
	</div>
</main>
