<script lang="ts">
	import { resolve } from '$app/paths';
	import Routes from '$lib/navigation/routes';
</script>

<ul class="space-y-2 p-8">
	<li><a class="underline" href={resolve(Routes.DemoComponents)}>components</a></li>
	<li><a class="underline" href={resolve(Routes.Home)}>homepage</a></li>
</ul>
