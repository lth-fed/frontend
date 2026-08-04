<script lang="ts">
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import './layout.css';

	let { children } = $props();

	function changeLanguage(event: Event): void {
		const locale = (event.currentTarget as HTMLSelectElement).value as 'en' | 'sv';
		if (locale !== getLocale()) void setLocale(locale, { reload: true });
	}
</script>

<svelte:head>
	<title>{m.site_title()}</title>
	<meta name="description" content={m.site_description()} />
</svelte:head>

<a class="skip-link" href="#main">{m.skip_to_content()}</a>
<header class="site-header">
	<div class="header-inner">
		<a class="wordmark" href="#top" aria-label="Teknologappen">Teknologappen</a>
		<nav aria-label="Primary navigation">
			<a href="#about">{m.nav_about()}</a>
			<a href="#legal">{m.nav_legal()}</a>
		</nav>
		<label class="language-picker">
			<span>{m.language()}</span>
			<select value={getLocale()} onchange={changeLanguage}>
				<option value="en">{m.english()}</option>
				<option value="sv">{m.swedish()}</option>
			</select>
		</label>
	</div>
</header>

{@render children()}

<footer class="site-footer">
	<div class="footer-inner">
		<div>
			<strong>Teknologappen</strong>
			<p>{m.footer_description()}</p>
		</div>
		<p>© {new Date().getFullYear()} E-sektionen inom TLTH</p>
	</div>
</footer>
