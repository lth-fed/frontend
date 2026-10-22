/**
 * All copy for the Teknologappen pitch page (routes/organisationer).
 *
 * The page is Swedish-only by request — there is no en.json/sv.json split here.
 * If the site later needs the page in English, move the strings into
 * messages/{sv,en}.json and swap this module for `m` from paraglide.
 */

export const PAGE = {
	title: 'Teknologappen för organisationer',
	description:
		'Teknologappen är en gemensam plattform för aktiviteter och biljetter. Här hittar du som representerar en organisation allt du behöver för att komma igång: funktioner, vem som får använda appen, presentationer och kontaktvägar.'
} as const;

export const HERO = {
	eyebrow: 'För sektioner och studentföreningar',
	title: 'Ert nästa evenemang, börjar här.',
	lead: 'Teknologappen är vår gemensamma plattform för aktiviteter och biljetter — byggd av studenter, för studenter, tillsammans med er.',
	cta: 'Boka ett möte',
	ctaSecondary: 'Se funktionerna'
} as const;

export type Feature = { title: string; description: string };

export const FEATURES: Feature[] = [
	{
		title: 'Aktiviteter över hela TLTH',
		description:
			'Skapa aktiviteter som syns för hela Teknologkåren — eller begränsa dem till er egen sektion, utskott eller grupp.'
	},
	{
		title: 'Biljetter direkt i appen',
		description:
			'Släpp biljetter med flera biljetttyper, reservationer och betalning via Swish.'
	},
	{
		title: 'Inloggning med LU-konto',
		description:
			'Användarna loggar in med sitt vanliga Lund-universitetskonto. Ingen ny inloggning, inga nya lösenord.'
	},
	{
		title: 'Notiser och nyheter',
		description:
			'Nå ut till era medlemmar med push-notiser och nyheter, på svenska och engelska, direkt i appen.'
	},
	{
		title: 'Ert eget utseende',
		description:
			'Appen anpassar logotyp och färger efter den sektion användaren tillhör. Er identitet, hela vägen.'
	},
	{
		title: 'Validering i dörren',
		description:
			'Biljetterna valideras med QR-kod direkt i appen — snabbt för både arrangörer och jobbare på plats.'
	},
	{
		title: 'Kvitton och försäljningsrapporter',
		description:
			'Automatiska kvitton till köparen och försäljningsrapporter redo för bokföring, med särredovisning för alkoholförsäljning.'
	},
	{
		title: 'Överförbara biljetter',
		description:
			'Användare kan överföra sin biljett till en vän — ni bestämmer själva om det ska tillåtas för ett evenemang.'
	},
	{
		title: 'Matpreferenser och tillval',
		description:
			'Samla in matpreferenser och sälj tillval som dryckespaket vid biljettköpet — med statistik per aktivitet.'
	},
	{
		title: 'Svenska och engelska',
		description:
			'Gränssnittet finns på svenska och engelska, så att även internationella studenter kan köpa biljetter. Notiser och aktiviteter visas på det språk man ställt in.'
	},
	{
		title: 'Admin i webbläsaren',
		description:
			'Administrera aktiviteter, biljetter, grupper och medlemmar i ett webbgränssnitt — funkar även på mobilen.'
	},
	{
		title: 'Byggt för att växa',
		description:
			'Öppen källkod och en modern teknisk grund som vi tillsammans kan bygga vidare på, funktion för funktion.'
	}
];

export const ELIGIBILITY = {
	eyebrow: 'Vem får använda Teknologappen?',
	title: 'Gratis för er som pluggar på Lunds Universitet.',
	lead: 'Teknologappen är helt gratis att använda. Det enda som kostar är Swish-avgiften vid biljettköp. Vi tar inte ut någon avgift för administratörer heller. Men hur funkar det? Jo, vi tycker det är skitkul att jobba med och man har ju CSN:)',
	groupsTitle: 'Det här gäller för',
	groups: [
		'Sektioner inom Teknologkåren vid LTH (TLTH)',
		'Andra studentföreningar för teknologer',
		'Organisationer som enbart riktar sig till studenter vid Lunds universitet (annars kan ju medlemmarna inte logga in. stelt...)'
	],
	costTitle: 'Vad kostar det?',
	cost: [
		'Gratis att använda appen och admin-gränssnittet.',
		'Vid biljettförsäljning betalar köparen Swish-transaktionsavgiften — för närvarande cirka 1,6 %.',
		'Inga fasta avgifter, inga månadskostnader, ingen licens.'
	],
	accessTitle: 'Så får ni tillgång till admin',
	access:
		'Mejla oss så kan ni få tillgång till administrationssidan där ni skapar aktiviteter och hanterar biljetter. Om ni inte är en sektion inom TLTH har vi gärna möte med er först!',
	accessCta: 'Mejla oss'
} as const;

export type Presentation = { title: string; description: string; file: string; poster: string };

export const PRESENTATIONS: Presentation[] = [
	{
		title: 'Teknologappen — presentation för sektioner (2026-10)',
		description: 'Huvudpresentationen: vad appen är, vad den löser och var vi är på väg. Innehåller även siffror från när E-sektionen använde sig av den under nollningen 2026.',
		file: '/public-salesdeck/teknologappen-presentation.pdf',
		poster: '/public-salesdeck/teknologappen-presentation.png'
	},
	{
		title: 'Första presentationen om vår vision (2026-06)',
		description:
			'En kort presentation om vad våra ursprungliga mål var. Innehåller även teknisk information för att locka utvecklare.',
		file: '/public-salesdeck/intro-till-organisationer.pdf',
		poster: '/public-salesdeck/intro-till-organisationer.png'
	}
];

export const PRESENTATIONS_SECTION = {
	eyebrow: 'Material',
	title: 'Presentationer att ladda ner',
	lead: 'Klicka på ett kort för att ladda ner presentationen som PDF.'
} as const;

export const BOOKING = {
	eyebrow: 'Nästa steg',
	title: 'Boka ett möte med oss',
	lead: 'Vi träffas gärna och går igenom vad Teknologappen kan göra för just er organisation. Boka en tid i kalendern så hör vi av oss.',
	cta: 'Öppna bokningskalendern'
} as const;

/**
 * YouTube video IDs to embed inline on the page. Add IDs here as videos are
 * published; the page renders them as inline players in the order listed.
 */
export const VIDEO_IDS: string[] = ["axMzCEkHCSU", "UQrFhtaHl-g", "vn6-bSB2XVc", "Jk4-tN2hUiE", "QJIztThM4g0", "XZZI34KnsP8"];

export const VIDEOS = {
	eyebrow: 'Se appen i praktiken',
	title: 'Förklarande videor',
	lead: 'Korta filmer som visar hur appen fungerar — för arrangörer och för deltagare.'
} as const;

export const FOOTER_NOTE =
	'Teknologappen utvecklas tillsammans av E-, D- och F-sektionen inom TLTH.';
