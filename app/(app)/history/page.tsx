'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { macrosForGrams } from '@/lib/nutrition';
import { RingTriplet } from '@/components/RingTriplet';

type Food = { id: string; name: string; carbs: number; protein: number; fat: number };
type Entry = { id: string; food: Food; grams: number; date: string; phase: string | null; training_day: boolean | null };

export default function HistoryPage() {
	const [byDate, setByDate] = useState<Record<string, Entry[]>>({});
	const [targetsMap, setTargetsMap] = useState<Record<string, { p: number; f: number; c: number }>>({});
	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth()); // 0-based
	const [detailDate, setDetailDate] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			if (!supabase) return;
			// 拉取所选月份的数据范围
			const monthStart = new Date(year, month, 1);
			const monthEnd = new Date(year, month + 1, 0);
			const sinceStr = monthStart.toISOString().slice(0, 10);
			const untilStr = monthEnd.toISOString().slice(0, 10);
			const { data } = await supabase
				.from('entries')
				.select('id, grams, date, phase, training_day, food:food_id ( id, name, carbs, protein, fat )')
				.is('user_id', null)
				.gte('date', sinceStr)
				.lte('date', untilStr)
				.order('date', { ascending: false })
				.order('created_at', { ascending: false });
			if (data) {
				const map: Record<string, Entry[]> = {};
				for (const r of data as any[]) {
					const e: Entry = {
						id: r.id,
						grams: parseFloat(r.grams),
						date: r.date,
						phase: r.phase,
						training_day: r.training_day,
						food: {
							id: r.food.id,
							name: r.food.name,
							carbs: parseFloat(r.food.carbs),
							protein: parseFloat(r.food.protein),
							fat: parseFloat(r.food.fat)
						}
					};
					map[e.date] ||= [];
					map[e.date].push(e);
				}
				setByDate(map);
			}
			// 取所有目标组合
			const { data: mts } = await supabase
				.from('macro_targets')
				.select('phase, day_type, protein_g, fat_g, carbs_g')
				.is('user_id', null);
			if (mts) {
				const m: Record<string, { p: number; f: number; c: number }> = {};
				for (const row of mts as any[]) {
					m[`${row.phase}:${row.day_type}`] = { p: parseFloat(row.protein_g), f: parseFloat(row.fat_g), c: parseFloat(row.carbs_g) };
				}
				setTargetsMap(m);
			}
		})();
	}, [year, month]);

	// 生成当月日历网格
	const first = new Date(year, month, 1);
	const firstWeekday = (first.getDay() + 6) % 7; // 转为周一=0
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells: Array<{ dateStr?: string }> = [];
	for (let i = 0; i < firstWeekday; i++) cells.push({});
	for (let d = 1; d <= daysInMonth; d++) {
		const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		cells.push({ dateStr: ds });
	}
	while (cells.length % 7 !== 0) cells.push({});

	const monthLabel = useMemo(() => `${year}年${String(month + 1).padStart(2, '0')}月`, [year, month]);

	function prevMonth() {
		const d = new Date(year, month, 1);
		d.setMonth(d.getMonth() - 1);
		setYear(d.getFullYear());
		setMonth(d.getMonth());
	}
	function nextMonth() {
		const d = new Date(year, month, 1);
		d.setMonth(d.getMonth() + 1);
		setYear(d.getFullYear());
		setMonth(d.getMonth());
	}

	const selectedEntries = detailDate ? byDate[detailDate] ?? [] : [];

	return (
		<div className="container-safe py-4 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">历史记录</h1>
				<div className="flex items-center gap-2">
					<button onClick={prevMonth} className="rounded border border-gray-300 px-2 py-1 text-sm">上月</button>
					<div className="text-sm text-gray-700">{monthLabel}</div>
					<button onClick={nextMonth} className="rounded border border-gray-300 px-2 py-1 text-sm">下月</button>
				</div>
			</div>
			<div className="grid grid-cols-7 gap-2">
				{['一','二','三','四','五','六','日'].map((w) => (
					<div key={w} className="text-center text-xs text-gray-500">{w}</div>
				))}
				{cells.map((c, idx) => {
					if (!c.dateStr) return <div key={idx} className="h-20 rounded border border-transparent" />;
					const list = byDate[c.dateStr] || [];
					let totals = { c: 0, p: 0, f: 0, kcal: 0 };
					for (const e of list) {
						const m = macrosForGrams(e.food, e.grams);
						totals = { c: totals.c + m.carbs, p: totals.p + m.protein, f: totals.f + m.fat, kcal: totals.kcal + m.calories };
					}
					const meta = list[0];
					const key = meta ? `${meta.phase ?? 'maintain'}:${meta.training_day ? 'training' : 'rest'}` : '';
					const tg = key ? targetsMap[key] : undefined;
					const pc = tg ? Math.min(100, Math.round((totals.c / Math.max(1, tg.c)) * 100)) : 0;
					const pp = tg ? Math.min(100, Math.round((totals.p / Math.max(1, tg.p)) * 100)) : 0;
					const pf = tg ? Math.min(100, Math.round((totals.f / Math.max(1, tg.f)) * 100)) : 0;
					return (
						<button key={idx} onClick={() => setDetailDate(c.dateStr!)} className="h-20 rounded border border-gray-200 p-1 text-left">
							<div className="flex items-center justify-between">
								<div className="text-xs text-gray-600">{parseInt(c.dateStr.slice(-2), 10)}</div>
								<RingTriplet size={48} stroke={4} carbsPct={pc} proteinPct={pp} fatPct={pf} />
							</div>
						</button>
					);
				})}
			</div>
			{detailDate && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setDetailDate(null)}>
					<div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
						<div className="mb-2 flex items-center justify-between">
							<div className="text-sm font-medium">{detailDate} 明细</div>
							<button onClick={() => setDetailDate(null)} className="rounded border border-gray-300 px-2 py-1 text-xs">关闭</button>
						</div>
						<div className="space-y-2 max-h-[50vh] overflow-auto">
							{selectedEntries.length === 0 && <div className="text-sm text-gray-500">当日无记录</div>}
							{selectedEntries.map((e) => {
								const m = macrosForGrams(e.food, e.grams);
								return (
									<div key={e.id} className="rounded border border-gray-200 p-2">
										<div className="flex items-center justify-between">
											<div className="font-medium">{e.food.name}</div>
											<div className="text-xs text-gray-600">{e.grams} g</div>
										</div>
										<div className="mt-0.5 text-xs text-gray-600">
											热量 {Math.round(m.calories)} kcal · 碳水 {Math.round(m.carbs)}g · 蛋白质 {Math.round(m.protein)}g · 脂肪 {Math.round(m.fat)}g
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
			{/* 月内已有记录的日期列表 */}
			<div className="space-y-2">
				<h2 className="text-base font-medium">本月已有记录</h2>
				{Object.keys(byDate)
					.filter((ds) => ds.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`))
					.sort((a, b) => (a < b ? 1 : -1))
					.map((ds) => {
						const list = byDate[ds] || [];
						let totals = { c: 0, p: 0, f: 0, kcal: 0 };
						for (const e of list) {
							const m = macrosForGrams(e.food, e.grams);
							totals = { c: totals.c + m.carbs, p: totals.p + m.protein, f: totals.f + m.fat, kcal: totals.kcal + m.calories };
						}
						return (
							<button key={ds} onClick={() => setDetailDate(ds)} className="w-full rounded border border-gray-200 p-2 text-left">
								<div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">{ds}</div>
									<div className="text-xs text-gray-600">共 {list.length} 条</div>
								</div>
								<div className="mt-0.5 text-xs text-gray-600">
									{Math.round(totals.kcal)} kcal · 碳水 {Math.round(totals.c)}g · 蛋白质 {Math.round(totals.p)}g · 脂肪 {Math.round(totals.f)}g
								</div>
							</button>
						);
					})}
				{Object.keys(byDate).filter((ds) => ds.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)).length === 0 && (
					<div className="text-sm text-gray-500">本月还没有记录。</div>
				)}
			</div>
		</div>
	);
}

