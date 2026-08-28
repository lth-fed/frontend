<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import '$lib/state/locale.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { session } from '$lib/state/session.svelte';
	import { bootstrapAuth } from '$lib/auth/bootstrap';
	import { readNavigationIntent } from '$lib/navigation/stackNavigation';
	import Landing from '$lib/components/Landing.svelte';
	import SigningInFallback from '$lib/components/SigningInFallback.svelte';
	import './layout.css';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
	import { App } from '@capacitor/app';
	import { onMount } from 'svelte';
	import { invalidate as invalidateCache } from '$lib/api/cache';
	import {
		onResume as onPurchaseResume,
		restore as restorePurchase
	} from '$lib/purchase/purchase.svelte';
	import { monitorNetwork } from '$lib/state/network.svelte';
	import { Capacitor } from '@capacitor/core';
	import { syncServerClock } from '$lib/api/clients';
	import { SplashScreen } from '@capacitor/splash-screen';

	let { children } = $props();

	// The native launch screen (see `capacitor.config.ts`, `launchAutoHide: false`) stays up
	// through auth bootstrap so the branded splash bridges straight into the app instead of a
	// blank/"Signing in…" flash between it and the web content's first paint. Two rAFs let
	// whichever branch Svelte just picked (app / Landing / error) actually paint underneath
	// before it's revealed. Capped so a stalled bootstrap can't hold the splash forever — it
	// falls back to the in-app fallback screen, which has its own retry/sign-out affordance.
	let splashHidden = false;
	function hideSplashScreen() {
		if (splashHidden || !Capacitor.isNativePlatform()) return;
		splashHidden = true;
		requestAnimationFrame(() => requestAnimationFrame(() => void SplashScreen.hide()));
	}

	// Coming back to a backgrounded app: revalidate the fast-moving
	// resources (spec §3.3) and resync any active purchase flow (§4.2).
	// Pages re-render from cache instantly and refresh in the background.
	// On web this fires on tab re-focus.
	onMount(() => {
		if (page.route.id !== '/auth/callback') {
			void runAuthBootstrap().finally(hideSplashScreen);
		} else {
			hideSplashScreen();
		}
		window.setTimeout(hideSplashScreen, 4_000);
		const stopMonitoringNetwork = monitorNetwork(() => {
			invalidateCache(
				'me',
				'activities',
				'tickets',
				'purchased-tickets',
				'joinable-groups',
				'notification-history'
			);
		});
		const listener = App.addListener('resume', () => {
			invalidateCache('activities', 'tickets', 'notification-history');
			void syncServerClock()
				.catch((error) => console.warn('Could not refresh server clock', error))
				.finally(onPurchaseResume);
			if (!session.accessToken && (!bootstrapped || bootstrapFailed)) void runAuthBootstrap();
		});
		return () => {
			stopMonitoringNetwork();
			void listener.then((handle) => handle.remove());
		};
	});

	let bootstrapped = $state(false);
	let bootstrapFailed = $state(false);
	let bootstrapInFlight: Promise<void> | null = null;

	function authBootstrapWithTimeout(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const timeout = window.setTimeout(
				() => reject(new Error('Auth bootstrap timed out')),
				12_000
			);
			void bootstrapAuth().then(
				(result) => {
					window.clearTimeout(timeout);
					resolve(result);
				},
				(error) => {
					window.clearTimeout(timeout);
					reject(error);
				}
			);
		});
	}

	function runAuthBootstrap(): Promise<void> {
		if (bootstrapInFlight) return bootstrapInFlight;
		bootstrapInFlight = (async () => {
			const clockSync = syncServerClock().catch((error) =>
				console.warn('Could not synchronize server clock', error)
			);
			bootstrapped = false;
			bootstrapFailed = false;
			try {
				let succeeded = await authBootstrapWithTimeout().catch((error) => {
					console.warn('Auth bootstrap attempt 1 failed', error);
					return false;
				});
				if (!succeeded) {
					await new Promise((resolve) => window.setTimeout(resolve, 300));
					succeeded = await authBootstrapWithTimeout();
				}
				bootstrapFailed = !succeeded;
			} catch (error) {
				console.error('Auth bootstrap failed after retry', error);
				bootstrapFailed = true;
			} finally {
				bootstrapped = true;
				bootstrapInFlight = null;
			}
			// a queue spot / reservation may have survived the reload
			await clockSync;
			if (session.accessToken) void restorePurchase();
		})();
		return bootstrapInFlight;
	}

	afterNavigate(() => {
		if (bootstrapped) return;
		// The callback page owns the in-progress code exchange. Treating its `authenticating`
		// state as an abandoned login here would delete the PKCE state before it can finish.
		if (page.route.id === '/auth/callback') return;
		void runAuthBootstrap();
	});

	$effect(() => {
		const g = session.themeGuild;
		const els = [document.documentElement, document.body];
		if (g) els.forEach((el) => (el.dataset.guild = g));
		else els.forEach((el) => delete el.dataset.guild);
	});

	onNavigate((navigation) => {
		// WKWebView supplies the native interactive back gesture. Avoid keeping a
		// WebKit view-transition snapshot above the live page on iOS.
		if (Capacitor.getPlatform() === 'ios') return;
		if (!document.startViewTransition) return;
		if (!navigation.from || !navigation.to) return;

		const direction = navigation.type === 'popstate' ? 'back' : readNavigationIntent();
		const { documentElement } = document;

		return new Promise((resolve) => {
			documentElement.dataset.transitionDirection = direction;
			document
				.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				})
				.finished.finally(() => {
					delete documentElement.dataset.transitionDirection;
				});
		});
	});

	beforeNavigate((navigation) => {
		if (navigation.type !== 'popstate' || !navigation.from) return;

		if ((page.state.navDepth ?? 0) === 0) {
			navigation.cancel();
		}
	});
</script>

{#if page.route.id === '/auth/callback'}
	{@render children()}
{:else if !session.accessToken}
	{#if session.isProcessing || !bootstrapped}
		<SigningInFallback />
	{:else if bootstrapFailed}
		<div class="grid min-h-screen place-items-center px-6 text-center">
			<div class="flex w-full max-w-sm flex-col items-center gap-4">
				<h1 class="text-xl font-semibold text-gray-900">{m.auth_refresh_error_title()}</h1>
				<p class="text-sm text-gray-600">{m.auth_refresh_error_description()}</p>
				<button
					type="button"
					onclick={() => void runAuthBootstrap()}
					class="w-full rounded-full bg-black px-5 py-3.5 text-base font-semibold text-white">
					{m.auth_error_retry()}
				</button>
			</div>
		</div>
	{:else}
		<Landing />
	{/if}
{:else}
	{@const isShell = page.route.id?.includes('(shell)')}
	<div
		class="max-w-screen min-w-screen bg-gray-100 {isShell
			? ''
			: 'min-h-screen pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'}">
		{@render children()}
	</div>
{/if}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
