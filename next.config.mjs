import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const baseConfig = {
	experimental: {
		serverActions: {
			allowedOrigins: ['*']
		}
	},
	reactStrictMode: true
};

export default withPWA({
	dest: 'public',
	disable: !isProd,
	register: true,
	skipWaiting: true,
	// cache images, fonts, static assets by default
})(baseConfig);

