'use client';

import { useEffect, useState } from 'react';
import type { Phase, UserSettings } from '@/lib/nutrition';
import { caloriesFromMacros } from '@/lib/nutrition';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
	const [settings, setSettings] = useState<UserSettings>({
		phase: 'maintain',
		trainingDay: false,
		weightKg: 70,
		heightCm: 175,
		age: 28,
		sex: 'm',
		activityLevel: 'moderate'
	});

	const [trainingTargets, setTrainingTargets] = useState({ protein: 126, fat: 56, carbs: 200 });
	const [restTargets, setRestTargets] = useState({ protein: 126, fat: 56, carbs: 180 });

	useEffect(() => {
		loadTargets(settings.phase);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings.phase]);

	async function loadTargets(phase: Phase) {
		if (!supabase) return;
		const { data: t } = await supabase
			.from('macro_targets')
			.select('protein_g, fat_g, carbs_g')
			.is('user_id', null)
			.eq('phase', phase)
			.eq('day_type', 'training')
			.maybeSingle();
		const { data: r } = await supabase
			.from('macro_targets')
			.select('protein_g, fat_g, carbs_g')
			.is('user_id', null)
			.eq('phase', phase)
			.eq('day_type', 'rest')
			.maybeSingle();
		if (t) setTrainingTargets({ protein: parseFloat(t.protein_g), fat: parseFloat(t.fat_g), carbs: parseFloat(t.carbs_g) });
		if (r) setRestTargets({ protein: parseFloat(r.protein_g), fat: parseFloat(r.fat_g), carbs: parseFloat(r.carbs_g) });
	}

	async function saveTargets() {
		if (!supabase) return;
		await supabase.from('macro_targets').upsert([
			{ user_id: null, phase: settings.phase, day_type: 'training', protein_g: trainingTargets.protein, fat_g: trainingTargets.fat, carbs_g: trainingTargets.carbs },
			{ user_id: null, phase: settings.phase, day_type: 'rest', protein_g: restTargets.protein, fat_g: restTargets.fat, carbs_g: restTargets.carbs }
		]);
	}

	return (
		<div className="container-safe py-4 space-y-4">
			<h1 className="text-xl font-semibold">设置</h1>
			<div className="grid grid-cols-2 gap-3">
				<label className="col-span-2 text-sm">体重（kg）</label>
				<input
					type="number"
					value={settings.weightKg}
					onChange={(e) => setSettings((s) => ({ ...s, weightKg: parseFloat(e.target.value || '0') }))}
					className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm"
				/>
				<button
					onClick={async () => {
						if (!supabase) return;
						await supabase.from('user_settings').upsert({
							user_id: null,
							weight_kg: settings.weightKg
						});
					}}
					className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm"
				>
					保存体重
				</button>
				<label className="col-span-2 text-sm">相位</label>
				<select value={settings.phase} onChange={(e) => setSettings((s) => ({ ...s, phase: e.target.value as Phase }))} className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm">
					<option value="cut">减脂期</option>
					<option value="bulk">增肌期</option>
				</select>

				<label className="col-span-2 text-sm">训练日目标（单位 g）</label>
				<input type="number" value={trainingTargets.protein} onChange={(e) => setTrainingTargets((s) => ({ ...s, protein: parseFloat(e.target.value || '0') }))} placeholder="蛋白 g" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input type="number" value={trainingTargets.fat} onChange={(e) => setTrainingTargets((s) => ({ ...s, fat: parseFloat(e.target.value || '0') }))} placeholder="脂肪 g" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input type="number" value={trainingTargets.carbs} onChange={(e) => setTrainingTargets((s) => ({ ...s, carbs: parseFloat(e.target.value || '0') }))} placeholder="碳水 g" className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm" />
				<div className="col-span-2 text-xs text-gray-600">热量 = {caloriesFromMacros(trainingTargets.protein, trainingTargets.fat, trainingTargets.carbs)} kcal（按 4/4/9 计算）</div>

				<label className="col-span-2 text-sm">休息日目标（单位 g）</label>
				<input type="number" value={restTargets.protein} onChange={(e) => setRestTargets((s) => ({ ...s, protein: parseFloat(e.target.value || '0') }))} placeholder="蛋白 g" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input type="number" value={restTargets.fat} onChange={(e) => setRestTargets((s) => ({ ...s, fat: parseFloat(e.target.value || '0') }))} placeholder="脂肪 g" className="rounded border border-gray-300 px-3 py-2 text-sm" />
				<input type="number" value={restTargets.carbs} onChange={(e) => setRestTargets((s) => ({ ...s, carbs: parseFloat(e.target.value || '0') }))} placeholder="碳水 g" className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm" />
				<div className="col-span-2 text-xs text-gray-600">热量 = {caloriesFromMacros(restTargets.protein, restTargets.fat, restTargets.carbs)} kcal（按 4/4/9 计算）</div>

				<button onClick={saveTargets} className="col-span-2 rounded bg-sky-500 px-3 py-2 text-sm font-medium text-white">保存当前相位的宏目标</button>

			</div>

			<p className="text-xs text-gray-600">首页会根据“当前相位 + 是否训练日”自动选择对应目标，并按 4/4/9 计算热量用于显示。</p>
		</div>
	);
}

