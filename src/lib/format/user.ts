/**
 * Derive 2-letter initials from an LU stil-id-shaped user id, e.g.
 * `si1234mc-s` → `"SM"` (Simon Mechler). The id format encodes initials
 * as the *first* letter of each LL-pair around the four-digit run:
 * `LLNNNNLL[-s]`, so we read positions 0 and 6. Tolerates an optional
 * provider prefix like `test:` or `mail:`.
 *
 * Returns `undefined` for ids that don't fit the LU shape (e.g. an
 * email-provider id like `mail:foo@bar.com`) so callers can fall back
 * to whatever placeholder fits the context.
 */
export function initialsFromStilId(id: string | null | undefined): string | undefined {
	if (!id) return undefined;
	const stilId = id.replace(/^[a-z-]+:/, '');
	const match = /^([a-z])[a-z]\d{4}([a-z])[a-z](?:-s)?$/i.exec(stilId);
	if (!match) return undefined;
	return (match[1] + match[2]).toUpperCase();
}
