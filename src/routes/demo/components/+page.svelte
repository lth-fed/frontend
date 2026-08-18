<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
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
	import { slots } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';

	type NavId = 'home' | 'alerts' | 'profile' | 'settings';
	const navItems = [
		{ id: 'home' as NavId, icon: Home, label: 'Home' },
		{ id: 'alerts' as NavId, icon: Bell, label: 'Alerts' },
		{ id: 'profile' as NavId, icon: IdCard, label: 'Profile' },
		{ id: 'settings' as NavId, icon: Settings, label: 'Settings' }
	];
	let selectedNav = $state<NavId>('home');

	type ToolId = 'transfer' | 'wallet' | 'receipt' | 'activity';
	const toolItems = [
		{ id: 'transfer' as ToolId, icon: ArrowLeftRight, label: 'Transfer' },
		{ id: 'wallet' as ToolId, icon: Wallet, label: 'Add to wallet' },
		{ id: 'receipt' as ToolId, icon: Receipt, label: 'View receipt' },
		{ id: 'activity' as ToolId, icon: PartyPopper, label: 'View activity' }
	];

	const demoActivities = [
		{
			image: 'https://picsum.photos/seed/activity-a/640/360',
			badge: 'SITTNING',
			date: 'Mon, Apr 27 - 17:00',
			title: 'Annan sittning typ',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			location: 'Gasque-salen'
		},
		{
			image: 'https://picsum.photos/seed/activity-b/640/360',
			badge: 'FEST',
			date: 'Fri, May 01 - 21:00',
			title: 'Vårfest',
			description:
				'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
			location: 'Kårhuset'
		},
		{
			image: 'https://picsum.photos/seed/activity-c/640/360',
			badge: 'PUB',
			date: 'Tue, May 05 - 18:00',
			title: 'Tisdagspub',
			description:
				'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
			location: 'Pub-lokalen'
		}
	];

	const demoTickets = [
		{
			name: 'Simon Mechler',
			activityTitle: 'Cool sittning typ',
			creatorName: 'Guild demo',
			timeStart: new Date('2026-04-25T17:00'),
			timeEnd: new Date('2026-04-25T23:00'),
			location: 'Kan inga lokaler',
			ticketKindName: 'Wine Package +1',
			id: '00000000-0000-0000-0000-00000000xx01'
		},
		{
			name: 'Simon Mechler',
			activityTitle: 'Annan sittning typ',
			creatorName: 'Guild demo',
			timeStart: new Date('2026-04-27T17:00'),
			timeEnd: new Date('2026-04-27T23:00'),
			location: 'Gasque-salen',
			ticketKindName: 'Standard',
			id: '00000000-0000-0000-0000-00000000xx02'
		},
		{
			name: 'Simon Mechler',
			activityTitle: 'Tredje sittning',
			creatorName: 'Guild demo',
			timeStart: new Date('2026-04-29T18:00'),
			timeEnd: new Date('2026-04-30T00:00'),
			location: 'Kårhuset',
			ticketKindName: 'VIP',
			id: '00000000-0000-0000-0000-00000000xx03'
		}
	];
</script>

<main class="h-screen overflow-y-auto bg-gray-100 p-8">
	<h1 class="mb-4 text-2xl font-bold">Components</h1>

	<div class="flex flex-wrap items-start gap-10 pb-12">
		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">Ticket</p>
			<Ticket
				name="Simon Mechler"
				activityTitle="Cool sittning typ"
				creatorName="Guild demo"
				timeStart={new Date('2026-04-25T17:00')}
				timeEnd={new Date('2026-04-25T23:00')}
				location="Kan inga lokaler"
				ticketKindName="Wine Package +1"
				id="00000000-0000-0000-0000-000000000xx1"
				onAction={(id) => alert(`Action: ${id}`)} />
		</section>

		<section class="w-full space-y-3">
			<p class="text-sm font-bold text-gray-600">Long titles</p>
			<div class="flex flex-wrap items-start gap-6">
				<Ticket
					name="Simon Mechler"
					activityTitle="Vårfestssittning med temat årets största händelse 2026"
					creatorName="F-sektionen"
					timeStart={new Date('2026-04-25T17:00')}
					timeEnd={new Date('2026-04-25T23:00')}
					location="Kan inga F-lokaler"
					ticketKindName="Wine Package +1"
					id="00000000-0000-0000-0000-00000000fg01" />
				<div class="w-90">
					<ActivityCard
						image="https://picsum.photos/seed/long-title/640/360"
						badge="SITTNING"
						date="Mon, Apr 27 - 17:00"
						title="Vårens stora avslutningssittning för F-sektionen och vänner"
						description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
						location="Gasque-salen" />
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
				activity="Vinterbal"
				serial="#FG-6719284"
				qrData="#FG-6719284" />
		</section>

		<section class="w-full max-w-[320px] space-y-3">
			<p class="text-sm font-bold text-gray-600">TicketDetail — long</p>
			<TicketDetail
				name="Maximilianus Karlsson-Andersson"
				activity="Inskrivningssittningskommittéens vårfest"
				serial="#FG-6719284"
				qrData="#FG-6719284" />
		</section>

		<section class="w-full max-w-100 space-y-3">
			<p class="text-sm font-bold text-gray-600">TopBar</p>
			<div class="rounded-2xl bg-guild-surface">
				<TopBar
					native={false}
					leading={slots.avatar({
						userId: 'test:si1234mc-s',
						onclick: () => alert(m.top_bar_account_label())
					})}
					trailing={slots.bell(() => alert(m.top_bar_notifications_label()))} />
			</div>
		</section>

		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">NavBar</p>
			<NavBar
				items={navItems}
				selected={selectedNav}
				native={false}
				onSelect={(id) => (selectedNav = id)} />
		</section>

		<section class="space-y-3">
			<p class="text-sm font-bold text-gray-600">ToolBar</p>
			<ToolBar items={toolItems} onAction={(id) => alert(`Action: ${id}`)} />
		</section>

		<section class="w-full max-w-100 space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — tickets (click to open)</p>
			<Carousel items={demoTickets}>
				{#snippet item(t, canFlip, requestCenter)}
					<Ticket
						{...t}
						{canFlip}
						onRequestCenter={requestCenter}
						onAction={(id) => alert(`Action: ${id}`)} />
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-100 space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — empty</p>
			<Carousel items={[] as unknown[]}>
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#snippet item(_)}{/snippet}
				{#snippet empty()}
					<EmptyState
						icon={TicketIcon}
						title="Your tickets will appear here"
						cta={{ label: 'Kanske en CTA här?', onclick: () => alert('CTA clicked') }} />
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-100 space-y-3">
			<p class="text-sm font-bold text-gray-600">Carousel — activities</p>
			<Carousel items={demoActivities}>
				{#snippet item(a)}
					<div class="w-[320px]">
						<ActivityCard {...a} onclick={() => alert(`Activity: ${a.title}`)} />
					</div>
				{/snippet}
			</Carousel>
		</section>

		<section class="w-full max-w-100 space-y-3">
			<p class="text-sm font-bold text-gray-600">LinkCard</p>
			<LinkCard
				title="F-sektionen"
				description="Officiell hemsida för Fysiksektionen vid LTH."
				url="https://www.f.kth.se" />
			<LinkCard
				title="Vårens stora avslutningssittning för F-sektionen och vänner"
				description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation."
				url="https://example.com" />
		</section>

		<section class="w-full max-w-90 space-y-3">
			<p class="text-sm font-bold text-gray-600">ActivityCard</p>
			<ActivityCard
				image="https://picsum.photos/seed/sittning/640/360"
				badge="SITTNING"
				date="Mon, Apr 27 - 17:00"
				title="Annan sittning typ"
				description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
				location="Gasque-salen"
				onclick={() => alert('Activity clicked')} />
		</section>
	</div>
</main>
