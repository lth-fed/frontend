import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
import type { NavigationBarConfigureOptions } from '$lib/plugins/navigationBar/definitions';
import { navigationBar } from '$lib/plugins/navigationBar/navigationBar';
import { tabsBar } from '$lib/plugins/tabsBar/tabsBar';
import type { ToolBarConfigureOptions } from '$lib/plugins/toolBar/definitions';
import { toolBar } from '$lib/plugins/toolBar/toolBar';

export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;

await tabsBar
	.configure({
		visible: true,
		initialId: 'home',
		items: [
			{ id: 'home', title: 'Home', systemIcon: 'house.fill' },
			{ id: 'notifications', title: 'Notifications', systemIcon: 'bell.fill' },
			{ id: 'card', title: 'Card', systemIcon: 'person.text.rectangle.fill' },
			{ id: 'settings', title: 'Settings', systemIcon: 'gearshape.fill' }
		],
		selectedIconColor: '#ff9900'
	})
	.catch((error) => {
		console.error('Error configuring TabsBar:', error);
	});

async function basicNavbarExample() {
	const options: NavigationBarConfigureOptions = {
		title: 'My App',
		backButton: {
			id: 'back',
			systemIcon: 'chevron.backward'
		},
		actionButton: {
			id: 'menu',
			systemIcon: 'arrow.up',
			style: 'prominent'
		},
		visible: true
	};

	try {
		await navigationBar.configure(options);
		console.log('NavigationBar configured successfully');
	} catch (error) {
		console.error('Failed to configure NavigationBar:', error);
	}
}

await basicNavbarExample().catch((error) => {
	console.error('Error in basicNavbarExample:', error);
});

navigationBar.addListener('toolbarAction', (event) => {
	console.log(event);
});

async function basicToolBarExample() {
	const options: ToolBarConfigureOptions = {
		nodes: [
			{
				type: 'group',
				spacing: 'compact',
				gap: 4,
				buttons: [
					{ id: 'transfer', systemIcon: 'arrow.left.arrow.right', style: 'plain' },
					{ id: 'wallet', systemIcon: 'wallet.bifold.fill', style: 'plain' }
				]
			},
			{
				type: 'flexible-space'
			},
			{
				type: 'group',
				spacing: 'compact',
				gap: 4,
				buttons: [
					{ id: 'receipt', systemIcon: 'receipt.fill' },
					{ id: 'event', systemIcon: 'party.popper.fill' }
				]
			}
		],
		visible: true
	};

	try {
		await toolBar.configure(options);
		console.log('ToolBar configured successfully');
	} catch (error) {
		console.error('Failed to configure ToolBar:', error);
	}
}

await basicToolBarExample().catch((error) => {
	console.error('Error in basicToolBarExample:', error);
});

toolBar.addListener('buttonTap', (event) => {
	console.log('Toolbar button tapped:', event);
});
