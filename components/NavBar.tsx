import Link from 'next/link';
import { Home, Salad, Settings, History } from 'lucide-react';

export function NavBar() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
			<div className="container-safe">
				<div className="grid grid-cols-4 py-2 text-xs">
					<Link href="/" className="flex flex-col items-center gap-1 px-2 py-1">
						<Home size={18} />
						<span>首页</span>
					</Link>
					<Link href="/foods" className="flex flex-col items-center gap-1 px-2 py-1">
						<Salad size={18} />
						<span>食物</span>
					</Link>
					<Link href="/history" className="flex flex-col items-center gap-1 px-2 py-1">
						<History size={18} />
						<span>历史</span>
					</Link>
					<Link href="/settings" className="flex flex-col items-center gap-1 px-2 py-1">
						<Settings size={18} />
						<span>设置</span>
					</Link>
				</div>
			</div>
		</nav>
	);
}

