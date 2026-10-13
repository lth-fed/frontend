<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		BOOKING,
		ELIGIBILITY,
		FEATURES,
		FOOTER_NOTE,
		HERO,
		PAGE,
		PRESENTATIONS,
		PRESENTATIONS_SECTION,
		VIDEOS,
		VIDEO_IDS
	} from '$lib/tappen-content';

	const CALENDAR_URL = 'https://calendar.app.google/8onRM8GRsP6WE9qf9';
	const CONTACT_MAIL = 'mailto:informationschef@esek.se';
	const ADMIN_URL = 'https://admin.teknologappen.se';

	const sections = [
		{ id: 'funktioner', label: 'Funktioner' },
		{ id: 'vilka', label: 'Vem får använda?' },
		{ id: 'presentationer', label: 'Presentationer' },
		{ id: 'videor', label: 'Men hur ser det ut och hur funkar det?' },
		{ id: 'boka', label: 'Boka möte' }
	] as const;

	let active = $state<string>(sections[0].id);

	function activate(id: string) {
		active = id;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	// Highlight the tab of the section currently in view.
	$effect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) active = entry.target.id;
				}
			},
			{ rootMargin: '-40% 0px -55% 0px' }
		);
		for (const section of sections) {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{PAGE.title} — Teknologappen</title>
	<meta name="description" content={PAGE.description} />
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="tappen-page">
	<!-- Hero -->
	<section class="tappen-hero">
		<div class="tappen-hero-inner">
			<div class="tappen-hero-copy">
				<img class="tappen-logo" src="/favicon.svg" alt="Teknologappens logotyp" />
				<p class="eyebrow">{HERO.eyebrow}</p>
				<h1>{HERO.title}</h1>
				<p class="lead">{HERO.lead}</p>
				<div class="actions">
					<a class="button secondary" href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
						{HERO.cta}
					</a>
					<button class="button secondary" type="button" onclick={() => activate('funktioner')}>
						{HERO.ctaSecondary}
					</button>
				</div>
			</div>
			<div class="tappen-hero-cards" aria-hidden="true">
				<div class="tappen-stat-card">
					<strong>Gratis</strong>
					<span>helt utan fasta kostnader</span>
				</div>
				<div class="tappen-stat-card">
					<strong>~1,6 %</strong>
					<span>Swish-avgift vid biljettköp — vi tar ingen avgift!</span>
				</div>
				<div class="tappen-stat-card">
					<strong>LU-inlogg</strong>
					<span>ingen ny inloggning för användarna</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Tab navigation -->
	<nav class="tappen-tabs" aria-label="Sidans innehåll">
		<div class="tappen-tabs-inner">
			{#each sections as section (section.id)}
				<button
					type="button"
					class:active={active === section.id}
					aria-current={active === section.id ? 'true' : undefined}
					onclick={() => activate(section.id)}>
					{section.label}
				</button>
			{/each}
		</div>
	</nav>

	<!-- Features -->
	<section class="section tappen-section" id="funktioner">
		<div class="section-inner">
			<div class="section-heading">
				<p class="eyebrow">Funktioner</p>
				<h2>Allt ni behöver för era evenemang.</h2>
				<p>
					Teknologappen samlar aktiviteter, biljetter, betalning och kommunikation i en och samma
					app — så att ni kan fokusera på själva evenemanget.
				</p>
			</div>
			<div class="tappen-feature-grid">
				{#each FEATURES as feature, i (feature.title)}
					<article>
						<!-- <span class="feature-number">{String(i + 1).padStart(2, '0')}</span> -->
						<h3 class="font-bold mb-2">{feature.title}</h3>
						<p>{feature.description}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<!-- Eligibility + pricing -->
	<section class="section tappen-section tappen-eligibility" id="vilka">
		<div class="section-inner">
			<div class="section-heading">
				<p class="eyebrow">{ELIGIBILITY.eyebrow}</p>
				<h2>{ELIGIBILITY.title}</h2>
				<p>{ELIGIBILITY.lead}</p>
			</div>
			<div class="tappen-eligibility-grid">
				<article class="tappen-card">
					<h3>{ELIGIBILITY.groupsTitle}</h3>
					<ul>
						{#each ELIGIBILITY.groups as group (group)}
							<li>{group}</li>
						{/each}
					</ul>
				</article>
				<article class="tappen-card">
					<h3>{ELIGIBILITY.costTitle}</h3>
					<ul>
						{#each ELIGIBILITY.cost as line (line)}
							<li>{line}</li>
						{/each}
					</ul>
				</article>
				<article class="tappen-card tappen-card-wide">
					<h3>{ELIGIBILITY.accessTitle}</h3>
					<p>{ELIGIBILITY.access}</p>
					<div class="actions">
						<a class="button primary" href={CONTACT_MAIL}>{ELIGIBILITY.accessCta}</a>
						<a class="button secondary" href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
							Öppna adminsidan
						</a>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!-- Presentations gallery -->
	<section class="section tappen-section" id="presentationer">
		<div class="section-inner">
			<div class="section-heading">
				<p class="eyebrow">{PRESENTATIONS_SECTION.eyebrow}</p>
				<h2>{PRESENTATIONS_SECTION.title}</h2>
				<p>{PRESENTATIONS_SECTION.lead}</p>
			</div>
			<div class="tappen-gallery">
				{#each PRESENTATIONS as presentation (presentation.file)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- static asset, not a route -->
					<a class="tappen-gallery-card" href={presentation.file} download>
						<img class="self-center" src={presentation.poster} alt="Förhandsvisning av {presentation.title}" />
						<span class="tappen-gallery-meta">
							<strong>{presentation.title}</strong>
							<span>{presentation.description}</span>
							<span class="tappen-gallery-cta">Ladda ner PDF ↓</span>
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Videos -->
	<section class="section tappen-section tappen-videos" id="videor">
		<div class="section-inner">
			<div class="section-heading">
				<p class="eyebrow">{VIDEOS.eyebrow}</p>
				<h2>{VIDEOS.title}</h2>
				<p>{VIDEOS.lead}</p>
			</div>
			{#if VIDEO_IDS.length > 0}
				<div class="tappen-video-grid">
					{#each VIDEO_IDS as videoId (videoId)}
						<div class="tappen-video-frame">
							<iframe
								src="https://www.youtube-nocookie.com/embed/{videoId}"
								title="Teknologappen — förklarande video"
								loading="lazy"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen></iframe>
						</div>
					{/each}
				</div>
			{:else}
				<p class="tappen-video-placeholder">Videor publiceras här inom kort.</p>
			{/if}
		</div>
	</section>

	<!-- Booking -->
	<section class="section tappen-section tappen-booking" id="boka">
		<div class="section-inner tappen-booking-inner">
			<div>
				<p class="eyebrow">{BOOKING.eyebrow}</p>
				<h2>{BOOKING.title}</h2>
				<p class="lead">{BOOKING.lead}</p>
				<div class="actions">
					<a class="button primary" href={CALENDAR_URL} target="_blank" rel="noopener noreferrer">
						{BOOKING.cta}
					</a>
					<a class="button secondary" href={CONTACT_MAIL}>{ELIGIBILITY.accessCta}</a>
				</div>
			</div>
			<p class="tappen-booking-note">{FOOTER_NOTE}</p>
		</div>
	</section>

	<p class="tappen-back">
		<a href={resolve('/')}>← Tillbaka till teknologappen.se</a>
	</p>
</main>
