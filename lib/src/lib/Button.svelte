<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	const { children, ...rest }: HTMLInputAttributes = $props()
</script>

<button {...rest} class={"px-5 py-3 bg-linear-to-br from-gray-200 to-gray-300 drop-shadow-md rounded-md enabled:cursor-pointer border-2 border-gray-200 enabled:hover:scale-102 enabled:hover:brightness-98 enabled:active:scale-100 enabled:active:brightness-95 disabled:brightness-93 disabled:cursor-not-allowed transition " + rest["class"]}>{@render children!()}</button>
