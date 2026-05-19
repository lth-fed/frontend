import type { Guild } from '$lib/types/guild';

export type GuildInfo = {
	/** Display name in member voice (e.g. "F-sektionen"). */
	name: string;
	/** Path to the guild logo under static/. */
	logo: string;
};

export const guilds: Record<Guild, GuildInfo> = {
	f: { name: 'F-sektionen', logo: '/guild-logos/f.avif' },
	e: { name: 'E-sektionen', logo: '/guild-logos/e.avif' },
	m: { name: 'Maskinsektionen', logo: '/guild-logos/m.avif' },
	v: { name: 'V-sektionen', logo: '/guild-logos/v.avif' },
	a: { name: 'A-sektionen', logo: '/guild-logos/a.avif' },
	k: { name: 'K-sektionen', logo: '/guild-logos/k.avif' },
	d: { name: 'D-sektionen', logo: '/guild-logos/d.avif' },
	ing: { name: 'Ingenjörssektionen', logo: '/guild-logos/ing.avif' },
	w: { name: 'W-sektionen', logo: '/guild-logos/w.avif' },
	i: { name: 'I-sektionen', logo: '/guild-logos/i.avif' }
};
