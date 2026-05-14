<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";

	const { children, ...rest }: HTMLAnchorAttributes = $props()
</script>

<a {...rest} class={"underline " + rest["class"]}>{@render children!()}</a>
