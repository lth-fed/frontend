export type Lang = 'sv' | 'en'
export const lang: { lang: Lang } = $state({ lang: 'sv' })

export function getLang(): Lang {
	return lang.lang
}
export function setLang(newLang: Lang) {
	lang.lang = newLang
}

export function intl(msgObject: { [lang: string]: string }): string {
	return (
		msgObject[lang.lang] ??
		msgObject['sv'] ??
		msgObject['en'] ??
		Object.values(msgObject).at(0) ??
		'<no strings available>'
	)
}
