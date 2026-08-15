<script lang="ts">
	import LinkCard from '$lib/components/LinkCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { session } from '$lib/state/session.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Link as LinkIcon } from '@lucide/svelte';
	import type { Guild } from '$lib/types/guild';

	type LinkItem = {
		title: string;
		description: string;
		url: string;
	};

	const guildLinks: Record<Guild, LinkItem[]> = {
		f: [
			{
				title: 'F-sektionen',
				description: 'Evenemang, studiestöd och näringsliv för F, Pi och N.',
				url: 'https://fsektionen.se'
			},
			{
				title: 'tekniskfysik.org',
				description: 'Anteckningar, lösningar och gamla tentor från andra F-studenter.',
				url: 'https://tekniskfysik.org'
			}
		],
		e: [
			{
				title: 'E-sektionen',
				description: 'Nyheter, evenemang, utskott och mycket mycket mer!',
				url: 'https://esek.se'
			},
			{
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://evote2.esek.se'
			},
			// {
			// 	title: 'Bildarkivet',
			// 	description: 'Bilder från sektionens evenemang och aktiviteter.',
			// 	url: 'https://arkiv.esek.se'
			// },
			{
				title: 'Sångboken',
				description: 'Sittningssånger och gasquemelodier samlade på ett ställe.',
				url: 'https://sengbok.esek.se'
			},
			{
				title: 'Klaga',
				description: 'Klaga på kurser eller annat LTH-relaterat.',
				url: 'https://esek.se/klaga'
			},
			{
				title: 'LED',
				description: 'Jobba i sektionens café.',
				url: 'https://led.esek.se'
			}
		],
		m: [
			{
				title: 'Maskinsektionen',
				description: 'Utskott, evenemang och allt annat för M och TD.',
				url: 'https://maskinsektionen.com'
			},
			{
				title: 'M-köp',
				description: 'Köp merch och tygmärken från Prylmästeriet.',
				url: 'https://maskinsektionen.com/shop/'
			}
		],
		v: [
			{
				title: 'V-sektionen',
				description: 'Evenemang, utskott och info för V, L och Brand.',
				url: 'https://vsek.se'
			},
			{
				title: 'Branschdagen',
				description: 'Sektionens egen arbetsmarknadsdag.',
				url: 'https://www.branschdagen.se'
			}
		],
		a: [
			{
				title: 'A-sektionen',
				description: 'Evenemang, utskott och engagemang för A och ID.',
				url: 'https://www.asektionen.se'
			},
			{
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://asek-evote.esek.se'
			}
		],
		k: [
			{
				title: 'K-sektionen',
				description: 'Evenemang, utskott och kursstatistik för K och B.',
				url: 'https://ksektionen.se'
			},
			{
				title: 'KULA',
				description: 'Sektionens årliga arbetsmarknadsmässa.',
				url: 'https://kula.ksektionen.se'
			}
		],
		d: [
			{
				title: 'D-sektionen',
				description: 'Sociala evenemang, studiestöd och engagemang för D och C.',
				url: 'https://www.dsek.se'
			},
			{
				title: 'Gerda',
				description: 'Skapa motioner, propositioner och möteshandlingar.',
				url: 'https://gerda.dsek.se'
			}
		],
		ing: [
			{
				title: 'Ingenjörssektionen',
				description: 'Allt för dig på LTH Campus Helsingborg.',
				url: 'https://ingsekt.se'
			}
		],
		w: [
			{
				title: 'W-sektionen',
				description: 'Evenemang, utskott och info för W och RH.',
				url: 'https://www.wsektionen.com'
			},
			{
				title: 'E-vote',
				description: 'Rösta digitalt på sektionsmöten.',
				url: 'https://wsek-evote.esek.se'
			}
		],
		i: [
			{
				title: 'I-sektionen',
				description: 'Evenemang, möteshandlingar och info för I.',
				url: 'https://isek.se'
			}
		]
	};

	const links = $derived(session.guild ? guildLinks[session.guild] : []);
</script>

<section class="px-6">
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
