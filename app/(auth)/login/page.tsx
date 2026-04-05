'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!supabase) {
			setMessage('未检测到 Supabase 配置，请先在 .env.local 填写 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY');
		}
	}, []);

	async function signInWithOtp() {
		if (!supabase) return;
		setLoading(true);
		setMessage(null);
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
			}
		});
		setLoading(false);
		if (error) {
			setMessage(error.message);
		} else {
			setMessage('登录邮件已发送，请查收邮箱点击链接完成登录。');
		}
	}

	return (
		<div className="container-safe py-10 space-y-4">
			<h1 className="text-xl font-semibold">登录</h1>
			<p className="text-sm text-gray-600">输入邮箱，接收一次性登录链接（无需密码）。</p>
			<div className="flex gap-2">
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
				/>
				<button
					onClick={signInWithOtp}
					disabled={loading || !email}
					className="rounded bg-sky-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
				>
					{loading ? '发送中...' : '发送登录链接'}
				</button>
			</div>
			{message && <div className="text-sm text-gray-700">{message}</div>}
		</div>
	);
}

