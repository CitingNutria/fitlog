'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Food = { id: string; name: string; carbs: number; protein: number; fat: number; sort_order?: number };

export default function FoodsPage() {
	const [foods, setFoods] = useState<Food[]>([]);
	const [name, setName] = useState('');
	const [carbs, setCarbs] = useState('');
	const [protein, setProtein] = useState('');
	const [fat, setFat] = useState('');

	useEffect(() => {
		(async () => {
			if (!supabase) return;
			const { data } = await supabase
				.from('foods')
				.select('id, name, carbs, protein, fat, sort_order')
				.is('user_id', null)
				.order('sort_order', { ascending: false })
				.order('created_at', { ascending: false });
			if (data) {
				setFoods(
					data.map((f: any) => ({
						id: f.id,
						name: f.name,
						carbs: parseFloat(f.carbs),
						protein: parseFloat(f.protein),
						fat: parseFloat(f.fat),
						sort_order: f.sort_order ?? 0
					}))
				);
			}
		})();
	}, []);

	async function addFood() {
		if (!name) return;
		if (supabase) {
			const { data, error } = await supabase
				.from('foods')
				.insert({
					user_id: null,
					name,
					carbs: parseFloat(carbs || '0') || 0,
					protein: parseFloat(protein || '0') || 0,
					fat: parseFloat(fat || '0') || 0,
					sort_order: (foods[0]?.sort_order ?? 0) + 1
				})
				.select('id')
				.single();
			if (!error && data) {
				setFoods((prev) => [
					{ id: data.id, name, carbs: parseFloat(carbs || '0') || 0, protein: parseFloat(protein || '0') || 0, fat: parseFloat(fat || '0') || 0, sort_order: (foods[0]?.sort_order ?? 0) + 1 },
					...prev
				]);
			}
		}
		setName('');
		setCarbs('');
		setProtein('');
		setFat('');
	}

	async function removeFood(id: string) {
		if (supabase) {
			await supabase.from('foods').delete().eq('id', id);
			setFoods((prev) => prev.filter((x) => x.id !== id));
		}
	}

	async function moveFood(id: string, direction: 'up' | 'down') {
		const idx = foods.findIndex((f) => f.id === id);
		if (idx < 0) return;
		const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (neighborIdx < 0 || neighborIdx >= foods.length) return;
		const a = foods[idx];
		const b = foods[neighborIdx];
		if (supabase) {
			await supabase.from('foods').update({ sort_order: b.sort_order ?? 0 }).eq('id', a.id);
			await supabase.from('foods').update({ sort_order: a.sort_order ?? 0 }).eq('id', b.id);
		}
		const next = [...foods];
		[next[idx], next[neighborIdx]] = [next[neighborIdx], next[idx]];
		setFoods(next);
	}

	async function saveFoodEdit(f: Food) {
		if (supabase) {
			await supabase
				.from('foods')
				.update({
					name: f.name,
					carbs: f.carbs,
					protein: f.protein,
					fat: f.fat
				})
				.eq('id', f.id);
		}
	}

	return (
		<div className="container-safe py-4 space-y-4">
			<h1 className="text-xl font-semibold">食物库管理</h1>
			<div className="grid grid-cols-2 gap-2">
				<input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称" className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm" />
				<input value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="碳水" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="蛋白质" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input value={fat} onChange={(e) => setFat(e.target.value)} placeholder="脂肪" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<button onClick={addFood} className="col-span-2 rounded bg-sky-500 px-3 py-2 text-sm font-medium text-white">添加到食物库</button>
			</div>

			<div className="space-y-2">
				{foods.map((f, i) => (
					<div key={f.id} className="rounded border border-gray-200 p-3">
						<div className="flex items-center justify-between">
							<div className="font-medium">{f.name}</div>
							<div className="flex items-center gap-2">
								<button onClick={() => moveFood(f.id, 'up')} disabled={i === 0} className="text-sm disabled:opacity-40">上移</button>
								<button onClick={() => moveFood(f.id, 'down')} disabled={i === foods.length - 1} className="text-sm disabled:opacity-40">下移</button>
								<button onClick={() => removeFood(f.id)} className="text-sm text-red-600">删除</button>
							</div>
						</div>
						<div className="mt-2 grid grid-cols-4 items-center gap-2">
							<input value={f.name} onChange={(e) => setFoods((prev) => prev.map((x) => x.id === f.id ? { ...x, name: e.target.value } : x))} className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm" />
							<input type="number" value={f.carbs} onChange={(e) => setFoods((prev) => prev.map((x) => x.id === f.id ? { ...x, carbs: parseFloat(e.target.value || '0') } : x))} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="碳水" />
							<input type="number" value={f.protein} onChange={(e) => setFoods((prev) => prev.map((x) => x.id === f.id ? { ...x, protein: parseFloat(e.target.value || '0') } : x))} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="蛋白质" />
							<input type="number" value={f.fat} onChange={(e) => setFoods((prev) => prev.map((x) => x.id === f.id ? { ...x, fat: parseFloat(e.target.value || '0') } : x))} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="脂肪" />
							<button onClick={() => saveFoodEdit(f)} className="col-span-4 rounded border border-gray-300 px-2 py-1 text-sm">保存修改</button>
						</div>
						<div className="mt-1 text-xs text-gray-600">热量 {Math.round(f.protein * 4 + f.fat * 9 + f.carbs * 4)} kcal（按 4/4/9） · 碳水 {f.carbs}g · 蛋白质 {f.protein}g · 脂肪 {f.fat}g</div>
					</div>
				))}
				{foods.length === 0 && <div className="text-sm text-gray-500">暂无自定义食物。</div>}
			</div>
		</div>
	);
}

