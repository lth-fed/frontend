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

<div
	role="img"
	aria-label={m.qr_code_alt()}
	data-qr={data}
	class="grid overflow-hidden rounded-lg border-[10px] border-white bg-white"
	style:grid-template-columns={`repeat(${modules.length}, 1fr)`}
	style="width: {size}px; height: {size}px;">
	{#each modules as row, rowIndex (rowIndex)}
		{#each row as dark, columnIndex (`${rowIndex}-${columnIndex}`)}
			<span class:bg-black={dark} class:bg-white={!dark}></span>
		{/each}
	{/each}
</div>
