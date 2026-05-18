<script lang="ts">
	import LinkCard from '$lib/components/LinkCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { session } from '$lib/state/session.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Link as LinkIcon } from '@lucide/svelte';
	import type { Guild } from '$lib/types/guild';

	type LinkItem = {
		image: string;
		title: string;
		description: string;
		url: string;
	};

	const guildLinks: Record<Guild, LinkItem[]> = {
		f: [
			{
				image: 'https://picsum.photos/seed/links-f-1/240/240',
				title: 'F-sektionen',
				description: 'Evenemang, studiestöd och näringsliv för F, Pi och N.',
				url: 'https://fsektionen.se'
			},
			{
				image: 'https://picsum.photos/seed/links-f-2/240/240',
				title: 'tekniskfysik.org',
				description: 'Anteckningar, lösningar och gamla tentor från andra F-studenter.',
				url: 'https://tekniskfysik.org'
			}
		],
		e: [
			{
				image: 'https://picsum.photos/seed/links-e-1/240/240',
				title: 'E-sektionen',
				description: 'Nyheter, evenemang, utskott och mycket mycket mer!',
				url: 'https://esek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-e-2/240/240',
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://evote2.esek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-e-3/240/240',
				title: 'Bildarkivet',
				description: 'Bilder från sektionens evenemang och aktiviteter.',
				url: 'https://arkiv.esek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-e-4/240/240',
				title: 'Sångboken',
				description: 'Sittningssånger och gasquemelodier samlade på ett ställe.',
				url: 'https://sengbok.esek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-e-5/240/240',
				title: 'Klaga',
				description: 'Klaga på kurser eller annat LTH-relaterat.',
				url: 'https://esek.se/klaga'
			},
			{
				image: 'https://picsum.photos/seed/links-e-6/240/240',
				title: 'LED',
				description: 'Jobba i sektionens café.',
				url: 'https://led.esek.se'
			}
		],
		m: [
			{
				image: 'https://picsum.photos/seed/links-m-1/240/240',
				title: 'Maskinsektionen',
				description: 'Utskott, evenemang och allt annat för M och TD.',
				url: 'https://maskinsektionen.com'
			},
			{
				image: 'https://picsum.photos/seed/links-m-2/240/240',
				title: 'M-köp',
				description: 'Köp merch och tygmärken från Prylmästeriet.',
				url: 'https://maskinsektionen.com/shop/'
			}
		],
		v: [
			{
				image: 'https://picsum.photos/seed/links-v-1/240/240',
				title: 'V-sektionen',
				description: 'Evenemang, utskott och info för V, L och Brand.',
				url: 'https://vsek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-v-2/240/240',
				title: 'Branschdagen',
				description: 'Sektionens egen arbetsmarknadsdag.',
				url: 'https://www.branschdagen.se'
			}
		],
		a: [
			{
				image: 'https://picsum.photos/seed/links-a-1/240/240',
				title: 'A-sektionen',
				description: 'Evenemang, utskott och engagemang för A och ID.',
				url: 'https://www.asektionen.se'
			},
			{
				image: 'https://picsum.photos/seed/links-a-2/240/240',
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://asek-evote.esek.se'
			}
		],
		k: [
			{
				image: 'https://picsum.photos/seed/links-k-1/240/240',
				title: 'K-sektionen',
				description: 'Evenemang, utskott och kursstatistik för K och B.',
				url: 'https://ksektionen.se'
			},
			{
				image: 'https://picsum.photos/seed/links-k-2/240/240',
				title: 'KULA',
				description: 'Sektionens årliga arbetsmarknadsmässa.',
				url: 'https://kula.ksektionen.se'
			}
		],
		d: [
			{
				image: 'https://picsum.photos/seed/links-d-1/240/240',
				title: 'D-sektionen',
				description: 'Sociala evenemang, studiestöd och engagemang för D och C.',
				url: 'https://www.dsek.se'
			},
			{
				image: 'https://picsum.photos/seed/links-d-2/240/240',
				title: 'Gerda',
				description: 'Skapa motioner, propositioner och möteshandlingar.',
				url: 'https://gerda.dsek.se'
			}
		],
		ing: [
			{
				image: 'https://picsum.photos/seed/links-ing-1/240/240',
				title: 'Ingenjörssektionen',
				description: 'Allt för dig på LTH Campus Helsingborg.',
				url: 'https://ingsekt.se'
			}
		],
		w: [
			{
				image: 'https://picsum.photos/seed/links-w-1/240/240',
				title: 'W-sektionen',
				description: 'Evenemang, utskott och info för W och RH.',
				url: 'https://www.wsektionen.com'
			},
			{
				image: 'https://picsum.photos/seed/links-w-2/240/240',
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://wsek-evote.esek.se'
			}
		],
		i: [
			{
				image: 'https://picsum.photos/seed/links-i-1/240/240',
				title: 'I-sektionen',
				description: 'Evenemang, möteshandlingar och info för I.',
				url: 'https://isek.se'
			}
		]
	};

	const links = $derived(session.guild ? guildLinks[session.guild] : []);
</script>

<header class="mt-2 px-6">
	<h2 class="text-2xl font-bold">{m.links_page_title()}</h2>
</header>

<section class="px-6 pt-4 pb-40">
	{#if links.length === 0}
		<EmptyState icon={LinkIcon} title={m.links_empty_title()} />
	{:else}
		<div class="space-y-3">
			{#each links as link (link.url)}
				<LinkCard {...link} />
			{/each}
		</div>
	{/if}
</section>
