import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	// .gitignore anchors /.svelte-kit, /build and src/lib/paraglide to the repo root, so the nested
	// auth/ and lib/ packages leak their build output and generated messages into this scope.
	{
		ignores: [
			'ios/**',
			'android/**',
			'**/.svelte-kit/',
			'**/build/',
			'**/dist/',
			'**/src/lib/paraglide/'
		]
	},
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-restricted-imports': [
				'warn',
				{
					paths: [
						{
							name: '$app/navigation',
							importNames: ['goto', 'pushState', 'replaceState'],
							message:
								'Prefer using the custom navigation helpers in src/lib/navigation/stackNavigation.ts, unless you have a specific reason not to.'
						}
					]
				}
			],
			'no-restricted-syntax': [
				'warn',
				{
					selector: "MemberExpression[object.name='location'][property.name='href']",
					message:
						'Prefer using the custom navigation helpers in src/lib/navigation/stackNavigation.ts, unless you have a specific reason not to.'
				},
				{
					selector:
						"MemberExpression[object.type='MemberExpression'][object.object.name='window'][object.property.name='location'][property.name='href']",
					message:
						'Prefer using the custom navigation helpers in src/lib/navigation/stackNavigation.ts, unless you have a specific reason not to.'
				}
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['src/lib/navigation/stackNavigation.ts', 'auth/**'],
		rules: {
			'no-restricted-imports': 'off',
			'no-restricted-syntax': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
