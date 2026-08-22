<script lang="ts">
	import qrcode from 'qrcode-generator';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		data: string;
		size?: number;
	}

	let { data, size = 200 }: Props = $props();

	const modules = $derived.by(() => {
		const code = qrcode(0, 'M');
		code.addData(data, 'Byte');
		code.make();
		const count = code.getModuleCount();
		return Array.from({ length: count }, (_, row) =>
			Array.from({ length: count }, (_, column) => code.isDark(row, column))
		);
	});
</script>

<!-- colours instead of tailwind classes to make browser force dark mode work with it -->
<div
	role="img"
	aria-label={m.qr_code_alt()}
	data-qr={data}
	class="qr-code grid overflow-hidden border-10"
	style:grid-template-columns={`repeat(${modules.length}, 1fr)`}
	style="width: {size}px; height: {size}px; background-color: #ffffff; border-color: #ffffff;">
	{#each modules as row, rowIndex (rowIndex)}
		{#each row as dark, columnIndex (`${rowIndex}-${columnIndex}`)}
			<span style:background-color={dark ? '#000000' : '#ffffff'}></span>
		{/each}
	{/each}
</div>

<style>
	.qr-code,
	.qr-code * {
		color-scheme: only light;
		forced-color-adjust: none;
		print-color-adjust: exact;
	}
</style>
