<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements'

	let { value = $bindable(), ...rest }: HTMLInputAttributes = $props()
</script>

<input
	type="text"
	{...rest}
	bind:value
	class={'rounded-md border-2 border-gray-300 bg-linear-to-br from-gray-100 to-gray-200 px-3 py-2 drop-shadow-md transition enabled:hover:brightness-98 enabled:active:brightness-95 disabled:brightness-93 disabled:cursor-not-allowed ' +
		rest['class']} />
