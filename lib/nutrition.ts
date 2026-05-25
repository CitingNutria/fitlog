export type Phase = 'cut' | 'bulk' | 'maintain';

export type UserSettings = {
	phase: Phase;
	trainingDay: boolean;
	weightKg: number; // 仅作将来参考，当前目标手动配置
	heightCm: number;
	age: number;
	sex: 'm' | 'f';
	activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
};

export type MacroTarget = { proteinG: number; fatG: number; carbsG: number; calories: number };

export function macrosForGrams(food: { carbs: number; protein: number; fat: number; calories?: number; sodium_mg?: number }, grams: number) {
	const ratio = grams / 100;
	const carbs = food.carbs * ratio;
	const protein = food.protein * ratio;
	const fat = food.fat * ratio;
	const calories = food.calories != null ? food.calories * ratio : carbs * 4 + protein * 4 + fat * 9;
	const sodium_mg = (food.sodium_mg ?? 0) * ratio;
	return { carbs, protein, fat, calories, sodium_mg };
}

export function caloriesFromMacros(proteinG: number, fatG: number, carbsG: number): number {
	return Math.round(proteinG * 4 + fatG * 9 + carbsG * 4);
}

export function computeMacroTargetsManual(proteinG: number, fatG: number, carbsG: number): MacroTarget {
	const calories = caloriesFromMacros(proteinG, fatG, carbsG);
	return { proteinG, fatG, carbsG, calories };
}

export function getDateStringWith4amBoundary(date = new Date()): string {
	const d = new Date(date);
	const hours = d.getHours();
	if (hours < 4) {
		// 归属到前一天
		d.setDate(d.getDate() - 1);
	}
	const y = d.getFullYear();
	const m = `${d.getMonth() + 1}`.padStart(2, '0');
	const day = `${d.getDate()}`.padStart(2, '0');
	return `${y}-${m}-${day}`;
}

