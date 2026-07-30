<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	const { children, ...rest }: HTMLInputAttributes = $props();
</script>

<button
	{...rest}
	class={'rounded-md border-2 border-gray-200 bg-linear-to-br from-gray-200 to-gray-300 px-5 py-3 drop-shadow-md transition enabled:cursor-pointer enabled:hover:scale-102 enabled:hover:brightness-98 enabled:active:scale-100 enabled:active:brightness-95 disabled:cursor-not-allowed disabled:brightness-93 ' +
		rest['class']}>{@render children!()}</button>
