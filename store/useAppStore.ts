import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Phase } from '@/lib/nutrition';

type UIState = {
	phase: Phase;
	trainingDay: boolean;
	setPhase: (p: Phase) => void;
	setTrainingDay: (v: boolean) => void;
};

export const useAppStore = create<UIState>()(
	persist(
		(set) => ({
			phase: 'cut',
			trainingDay: false,
			setPhase: (p) => set({ phase: p }),
			setTrainingDay: (v) => set({ trainingDay: v })
		}),
		{
			name: 'fitlog-ui', // localStorage key
			partialize: (state) => ({ phase: state.phase, trainingDay: state.trainingDay })
		}
	)
);

