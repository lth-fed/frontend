import { mkdir, writeFile } from 'node:fs/promises';

const fingerprints = process.argv.slice(2).map((value) => {
	const hex = value.replaceAll(':', '').toUpperCase();
	if (!/^[0-9A-F]{64}$/.test(hex)) {
		throw new Error(
			'Expected a SHA-256 certificate fingerprint (64 hex digits, optionally colon-separated).'
		);
	}
	return hex.match(/.{2}/g).join(':');
});
if (!fingerprints.length) {
	throw new Error(
		'Usage: node scripts/configure-app-links.mjs CERTIFICATE_SHA256 [ANOTHER_CERTIFICATE_SHA256 ...]'
	);
}
const directory = new URL('../static/.well-known/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(
	new URL('assetlinks.json', directory),
	JSON.stringify(
		[
			{
				relation: ['delegate_permission/common.handle_all_urls'],
				target: {
					namespace: 'android_app',
					package_name: 'se.teknologappen.tappen',
					sha256_cert_fingerprints: [...new Set(fingerprints)]
				}
			}
		],
		null,
		2
	) + '\n'
);
console.log('Wrote static/.well-known/assetlinks.json. Rebuild and deploy app.teknologappen.se.');
