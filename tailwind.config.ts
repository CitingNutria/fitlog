import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./app/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./pages/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}'
	],
	theme: {
		extend: {
			colors: {
				bg: '#0b0f12'
			}
		}
	},
	plugins: []
};

export default config;

