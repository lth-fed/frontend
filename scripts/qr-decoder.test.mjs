import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { ZXING_WASM_SHA256, ZXING_WASM_VERSION } from 'barcode-detector/ponyfill';

test('the bundled QR binary matches the barcode detector runtime', async () => {
	// The scanner imports this asset separately from barcode-detector. Updating
	// only one dependency can build successfully but crash when decoding a QR.
	const binary = await readFile(
		new URL(import.meta.resolve('zxing-wasm/reader/zxing_reader.wasm'))
	);
	assert.equal(
		createHash('sha256').update(binary).digest('hex'),
		ZXING_WASM_SHA256,
		`The bundled WASM must match barcode-detector's ZXing ${ZXING_WASM_VERSION}`
	);
});
