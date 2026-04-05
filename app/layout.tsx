import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
	title: 'FitLog',
	description: '简单好用的饮食记录与营养追踪',
	manifest: '/manifest.json',
	themeColor: '#0ea5e9',
	icons: [
		{ rel: 'icon', url: '/icons/icon-192.png' },
		{ rel: 'apple-touch-icon', url: '/icons/icon-192.png' }
	]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<body>
				<div className="pb-16">
					{children}
				</div>
				<NavBar />
			</body>
		</html>
	);
}

