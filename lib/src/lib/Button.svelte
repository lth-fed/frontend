<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";

	const { children, ...rest }: HTMLButtonAttributes = $props()
</script>

<button {...rest} class={"px-6 py-4 bg-gray-200 rounded-lg cursor-pointer drop-shadow-lg active:scale-95 active:brightness-95 transition " + rest["class"]}>{@render children!()}</button>
