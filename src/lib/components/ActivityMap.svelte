<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';

	interface Props {
		north: number;
		east: number;
		label: string;
	}

	let { north, east, label }: Props = $props();
	let container: HTMLDivElement;

	onMount(() => {
		let disposed = false;
		let destroy = () => {};
		void import('leaflet').then((leaflet) => {
			if (disposed) return;
			const map = leaflet.map(container, {
				center: [north, east],
				zoom: 15,
				scrollWheelZoom: false
			});
			leaflet
				.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				})
				.addTo(map);
			leaflet
				.circleMarker([north, east], {
					radius: 8,
					weight: 3,
					color: '#fff',
					fillColor: '#2563eb',
					fillOpacity: 1
				})
				.bindTooltip(label)
				.addTo(map);
			destroy = () => map.remove();
		});

		return () => {
			disposed = true;
			destroy();
		};
	});
</script>

<div
	bind:this={container}
	class="h-64 w-full overflow-hidden rounded-3xl border border-gray-100 bg-gray-200"
	aria-label={label}>
</div>
