'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { computeMacroTargetsManual, getDateStringWith4amBoundary, macrosForGrams, type UserSettings } from '@/lib/nutrition';
import { useAppStore } from '@/store/useAppStore';
import { Dumbbell, Plus, Salad } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Food = { id: string; name: string; carbs: number; protein: number; fat: number; calories?: number };
type Entry = { id: string; food: Food; grams: number; date: string };
type FoodRow = { id: string; name: string; carbs: any; protein: any; fat: any; calories: any; last_used_at?: any; show_in_quick?: any };

export default function HomePage() {
	const { phase, trainingDay, setPhase, setTrainingDay } = useAppStore();
	const [entries, setEntries] = useState<Entry[]>([]);
	const [quickFoods, setQuickFoods] = useState<Food[]>([]);
	const [search, setSearch] = useState('');
	const [customName, setCustomName] = useState('');
	const [customMacros, setCustomMacros] = useState({ carbs: '', protein: '', fat: '', calories: '' });
	const [customGrams, setCustomGrams] = useState<string>('');
	const [showCustomAdd, setShowCustomAdd] = useState(false);
	const today = getDateStringWith4amBoundary();
	const [dbChecking, setDbChecking] = useState(false);
	const [dbMessage, setDbMessage] = useState<string | null>(null);
	const [dbError, setDbError] = useState<string | null>(null);
	const [targets, setTargets] = useState<{ proteinG: number; fatG: number; carbsG: number; calories: number } | null>(null);

	useEffect(() => {
		let mounted = true;
		async function init() {
			if (!supabase) return;
			// 无登录模式：读取 user_id 为 null 的今日记录
			const { data: rows } = await supabase
				.from('entries')
				.select('id, grams, date, food:food_id ( id, name, carbs, protein, fat, calories )')
				.is('user_id', null)
				.eq('date', today)
				.order('created_at', { ascending: false });
			if (mounted && rows) {
				const mapped: Entry[] = rows.map((r: any) => ({
					id: r.id,
					grams: parseFloat(r.grams),
					date: r.date,
					food: {
						id: r.food.id,
						name: r.food.name,
						carbs: parseFloat(r.food.carbs),
						protein: parseFloat(r.food.protein),
						fat: parseFloat(r.food.fat),
						calories: r.food.calories != null ? parseFloat(r.food.calories) : undefined
					}
				}));
				setEntries(mapped);
			}
			// 读取“常用食物”快捷列表（与食物库管理保持一致：全量 + 同排序）
			const { data: foodsWithRecent, error: foodsWithRecentError } = await supabase
				.from('foods')
				.select('id, name, carbs, protein, fat, calories, last_used_at')
				.is('user_id', null)
				.eq('show_in_quick', true)
				.order('last_used_at', { ascending: false, nullsFirst: false })
				.order('sort_order', { ascending: false })
				.order('created_at', { ascending: false });

			let foods: FoodRow[] = (foodsWithRecent as FoodRow[] | null) ?? [];
			if (foodsWithRecentError) {
				setDbError(`读取常用食物失败：${foodsWithRecentError.message}。请先执行 show_in_quick 数据库迁移。`);
				foods = [];
			}

			if (mounted && foods) {
				setQuickFoods(
					foods.map((f: any) => ({
						id: f.id,
						name: f.name,
						carbs: parseFloat(f.carbs),
						protein: parseFloat(f.protein),
						fat: parseFloat(f.fat),
						calories: f.calories != null ? parseFloat(f.calories) : undefined
					}))
				);
			}
			// 读取当前相位与日类型对应的手动目标（来自 macro_targets），若没有则默认 1.8/0.8 per kg 推导一个示意值（可在设置里改）
			const dayType = trainingDay ? 'training' : 'rest';
			const { data: mt } = await supabase
				.from('macro_targets')
				.select('protein_g, fat_g, carbs_g')
				.is('user_id', null)
				.eq('phase', phase)
				.eq('day_type', dayType)
				.maybeSingle();
			let protein = 126; // 1.8 * 70
			let fat = 56; // 0.8 * 70
			let carbs = 200;
			if (mt) {
				protein = parseFloat(mt.protein_g);
				fat = parseFloat(mt.fat_g);
				carbs = parseFloat(mt.carbs_g);
			}
			if (mounted) setTargets(computeMacroTargetsManual(protein, fat, carbs));
		}
		init();
		return () => {
			mounted = false;
		};
	}, [phase, trainingDay]);

	const userSettings: UserSettings = {
		phase,
		trainingDay,
		weightKg: 70,
		heightCm: 175,
		age: 28,
		sex: 'm',
		activityLevel: 'moderate'
	};

	// targets 由 DB 驱动（或默认值），已在 useEffect 中设置

	const totals = useMemo(() => {
		return entries.reduce(
			(acc, e) => {
				const m = macrosForGrams(e.food, e.grams);
				return {
					carbs: acc.carbs + m.carbs,
					protein: acc.protein + m.protein,
					fat: acc.fat + m.fat,
					calories: acc.calories + m.calories
				};
			},
			{ carbs: 0, protein: 0, fat: 0, calories: 0 }
		);
	}, [entries]);

	async function markFoodUsed(foodId: string) {
		if (!supabase) return;
		const nowIso = new Date().toISOString();
		await supabase.from('foods').update({ last_used_at: nowIso }).eq('id', foodId).is('user_id', null);
		// 本地先更新，保证点击后立即重排，跨设备则由数据库同步
		setQuickFoods((prev) => {
			const idx = prev.findIndex((f) => f.id === foodId);
			if (idx < 0) return prev;
			const next = [...prev];
			const [used] = next.splice(idx, 1);
			next.unshift(used);
			return next;
		});
	}

	function looksLikeUuid(id: string) {
		return /^[0-9a-f-]{36}$/i.test(id);
	}

	async function ensureFoodInDb(base: Omit<Food, 'id'>, showInQuick = true): Promise<Food | null> {
		if (!supabase) return null;
		// 先按名称查找现有记录（避免重复）
		const { data: existing, error: selErr } = await supabase
			.from('foods')
			.select('id, name, carbs, protein, fat, calories')
			.is('user_id', null)
			.eq('name', base.name)
			.limit(1)
			.maybeSingle();
		if (!selErr && existing) {
			if (showInQuick) {
				await supabase.from('foods').update({ show_in_quick: true }).eq('id', existing.id);
			}
			return {
				id: existing.id,
				name: existing.name,
				carbs: parseFloat(existing.carbs),
				protein: parseFloat(existing.protein),
				fat: parseFloat(existing.fat),
				calories: existing.calories != null ? parseFloat(existing.calories) : undefined
			};
		}
		// 插入新食物
		const { data: foodRow, error } = await supabase
			.from('foods')
			.insert({
				user_id: null,
				name: base.name,
				carbs: base.carbs,
				protein: base.protein,
				fat: base.fat,
				calories: base.calories ?? null,
				show_in_quick: showInQuick
			})
			.select('id')
			.single();
		if (error) {
			setDbError(`写入 foods 失败：${error.message}`);
			return null;
		}
		return { id: foodRow.id, ...base };
	}

	async function quickAdd(food: Food, grams = 100) {
		setDbError(null);
		if (supabase) {
			let finalFood: Food = food;
			// 如果是演示数据（非 UUID），先把食物写入 foods 获取真实 id
			if (!looksLikeUuid(food.id)) {
				const created = await ensureFoodInDb({
					name: food.name,
					carbs: food.carbs,
					protein: food.protein,
					fat: food.fat,
					calories: food.calories
				});
				if (!created) {
					// 回退为本地
					setEntries((prev) => [{ id: Math.random().toString(36).slice(2), food, grams, date: today }, ...prev]);
					return;
				}
				finalFood = created;
			}
			const { data, error } = await supabase
				.from('entries')
				.insert({
					user_id: null,
					food_id: finalFood.id,
					grams,
					date: today,
					phase,
					training_day: trainingDay
				})
				.select('id')
				.single();
			if (!error && data) {
				setEntries((prev) => [{ id: data.id, food: finalFood, grams, date: today }, ...prev]);
				await markFoodUsed(finalFood.id);
				return;
			} else if (error) {
				setDbError(`写入 entries 失败：${error.message}`);
			}
		}
		// 本地兜底
		setEntries((prev) => [{ id: Math.random().toString(36).slice(2), food, grams, date: today }, ...prev]);
	}

	async function addCustomFood(mode: 'todayOnly' | 'todayAndQuick') {
		if (!customName) return;
		// 不再输入克数：统一按 100g 计入
		const grams = 100;
		const baseFood: Omit<Food, 'id'> = {
			name: customName,
			carbs: parseFloat(customMacros.carbs || '0') || 0,
			protein: parseFloat(customMacros.protein || '0') || 0,
			fat: parseFloat(customMacros.fat || '0') || 0,
			calories: customMacros.calories ? parseFloat(customMacros.calories) : undefined
		};

		if (mode === 'todayAndQuick') {
			// 同步到常用食物：写入 foods 后再加入今日记录
			if (supabase) {
				const food = await ensureFoodInDb(baseFood, true);
				if (food) {
					await quickAdd(food, grams);
					setQuickFoods((prev) => prev.some((f) => f.id === food.id) ? prev : [food, ...prev]);
					setCustomName('');
					setCustomMacros({ carbs: '', protein: '', fat: '', calories: '' });
					return;
				}
			}
			const food: Food = { id: Math.random().toString(36).slice(2), ...baseFood };
			await quickAdd(food, grams);
			setCustomName('');
			setCustomMacros({ carbs: '', protein: '', fat: '', calories: '' });
			return;
		}

		// 仅加入今日：写入数据库用于刷新/多端同步，但不显示在常用食物列表。
		if (supabase) {
			const food = await ensureFoodInDb(baseFood, false);
			if (food) {
				await quickAdd(food, grams);
				setCustomName('');
				setCustomMacros({ carbs: '', protein: '', fat: '', calories: '' });
				return;
			}
		}
		setEntries((prev) => [{ id: Math.random().toString(36).slice(2), food: { id: `temp-${Date.now()}`, ...baseFood }, grams, date: today }, ...prev]);
		setCustomName('');
		setCustomMacros({ carbs: '', protein: '', fat: '', calories: '' });
	}

	async function testDbConnection() {
		if (!supabase) {
			setDbMessage('未检测到 Supabase 配置（请检查 .env.local）');
			return;
		}
		setDbChecking(true);
		setDbMessage(null);
		try {
			// 读取今日 entries 的数量，验证连通性与 RLS/权限
			const { count, error } = await supabase
				.from('entries')
				.select('*', { count: 'exact', head: true })
				.is('user_id', null)
				.eq('date', today);
			if (error) {
				setDbMessage(`查询失败：${error.message}`);
			} else {
				setDbMessage(`连接成功：今日 entries 条数 = ${count ?? 0}`);
			}
		} catch (e: any) {
			setDbMessage(`异常：${e?.message ?? String(e)}`);
		} finally {
			setDbChecking(false);
		}
	}

	async function removeEntry(id: string) {
		// 先本地删除，提升响应速度
		setEntries((prev) => prev.filter((x) => x.id !== id));
		// 若看起来是 UUID，则尝试删除数据库记录
		if (supabase && /^[0-9a-f-]{36}$/i.test(id)) {
			await supabase.from('entries').delete().eq('id', id);
		}
	}

	return (
		<div className="container-safe py-4 space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">FitLog</h1>
				<button
					onClick={() => setTrainingDay(!trainingDay)}
					className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${trainingDay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}
				>
					<Dumbbell size={16} />
					{trainingDay ? '训练日' : '休息日'}
				</button>
			</header>
			<div className="flex items-center gap-2">
				<button
					onClick={() => location.reload()}
					className="rounded border border-gray-300 px-3 py-1 text-sm"
				>
					刷新数据
				</button>
				<button
					onClick={testDbConnection}
					disabled={dbChecking}
					className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-60"
				>
					{dbChecking ? '测试中…' : '测试数据库连接'}
				</button>
				{dbMessage && <span className="text-sm text-gray-700">{dbMessage}</span>}
			</div>
			<div>
				{dbError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{dbError}</div>}
			</div>

			<section className="space-y-3">
				<div className="flex gap-2">
					<select
						value={phase}
						onChange={(e) => setPhase(e.target.value as any)}
						className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
					>
						<option value="cut">减脂期</option>
						<option value="bulk">增肌期</option>
					</select>
				</div>
				<div className="grid grid-cols-1 gap-3">
					<ProgressBar label="碳水 (g)" value={totals.carbs} target={targets?.carbsG ?? 0} colorClass="bg-emerald-500" />
					<ProgressBar label="蛋白质 (g)" value={totals.protein} target={targets?.proteinG ?? 0} colorClass="bg-sky-500" />
					<ProgressBar label="脂肪 (g)" value={totals.fat} target={targets?.fatG ?? 0} colorClass="bg-pink-500" />
					<ProgressBar label="热量 (kcal)" value={totals.calories} target={targets?.calories ?? 0} colorClass="bg-amber-500" unit="kcal" />
				</div>
			</section>

			<section className="space-y-2">
				<h2 className="text-base font-medium">常用食物</h2>
				<div className="flex flex-wrap gap-2">
					{quickFoods.map((f) => (
						<button
							key={f.id}
							onClick={() => quickAdd(f, 100)}
							className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm"
						>
							<Plus size={14} />
							{f.name}
						</button>
					))}
					{quickFoods.length === 0 && <div className="text-sm text-gray-500">去“食物”页添加你常用的食物，它们会出现在这里。</div>}
				</div>
			</section>

			<section className="space-y-2">
				<div className="flex items-center justify-between">
					<h2 className="text-base font-medium">添加不常见食物</h2>
					<button onClick={() => setShowCustomAdd((v) => !v)} className="text-sm text-sky-600">
						{showCustomAdd ? '收起' : '展开'}
					</button>
				</div>
				{showCustomAdd && (
					<div className="grid grid-cols-2 gap-2">
						<input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="名称" className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm" />
						<div className="col-span-2 grid grid-cols-3 gap-2">
							<input value={customMacros.carbs} onChange={(e) => setCustomMacros((s) => ({ ...s, carbs: e.target.value }))} placeholder="碳水" className="rounded border border-gray-300 px-3 py-2 text-sm" />
							<input value={customMacros.protein} onChange={(e) => setCustomMacros((s) => ({ ...s, protein: e.target.value }))} placeholder="蛋白质" className="rounded border border-gray-300 px-3 py-2 text-sm" />
							<input value={customMacros.fat} onChange={(e) => setCustomMacros((s) => ({ ...s, fat: e.target.value }))} placeholder="脂肪" className="rounded border border-gray-300 px-3 py-2 text-sm" />
						</div>
						<button onClick={() => addCustomFood('todayOnly')} className="inline-flex items-center justify-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm font-medium">
							仅加入今日
						</button>
						<button onClick={() => addCustomFood('todayAndQuick')} className="inline-flex items-center justify-center gap-2 rounded bg-sky-500 px-3 py-2 text-sm font-medium text-white">
							<Salad size={16} />
							加入今日并保存到常用
						</button>
					</div>
				)}
			</section>

			<section className="space-y-2 pb-20">
				<h2 className="text-base font-medium">今日记录</h2>
				<div className="space-y-1.5">
					{entries.map((e) => {
						const m = macrosForGrams(e.food, e.grams);
						return (
							<div key={e.id} className="rounded border border-gray-200 p-2">
								<div className="flex items-center justify-between gap-2">
							<div className="font-medium">{e.food.name}</div>
							<button
								onClick={() => removeEntry(e.id)}
								className="rounded border border-gray-300 px-2 py-0.5 text-xs"
							>
								删除
							</button>
								</div>
								<div className="mt-0.5 text-xs text-gray-600">
									热量 {Math.round(m.calories)} kcal · 碳水 {Math.round(m.carbs)}g · 蛋白质 {Math.round(m.protein)}g · 脂肪 {Math.round(m.fat)}g
								</div>
							</div>
						);
					})}
					{entries.length === 0 && <div className="text-sm text-gray-500">还没有记录，试试上面的常用食物或自定义添加。</div>}
				</div>
			</section>
		</div>
	);
}
