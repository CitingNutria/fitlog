import React from 'react';

type Props = {
	size?: number;
	stroke?: number;
	// percents 0-100
	carbsPct: number;     // emerald
	proteinPct: number;   // sky
	fatPct: number;       // pink
};

export function RingTriplet({ size = 56, stroke = 4, carbsPct, proteinPct, fatPct }: Props) {
	const r1 = (size / 2) - stroke / 2;
	const r2 = r1 - (stroke + 2);
	const r3 = r2 - (stroke + 2);
	const center = size / 2;
	const c1 = 2 * Math.PI * r1;
	const c2 = 2 * Math.PI * r2;
	const c3 = 2 * Math.PI * r3;

	function seg(circumference: number, pct: number) {
		const p = Math.max(0, Math.min(100, pct));
		const dash = (p / 100) * circumference;
		const gap = circumference - dash;
		return `${dash} ${gap}`;
	}

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle cx={center} cy={center} r={r1} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
			<circle cx={center} cy={center} r={r2} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
			<circle cx={center} cy={center} r={r3} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />

			<circle
				cx={center} cy={center} r={r1}
				stroke="#10b981" strokeWidth={stroke} fill="none"
				strokeDasharray={seg(c1, carbsPct)}
				transform={`rotate(-90 ${center} ${center})`}
				strokeLinecap="round"
			/>
			<circle
				cx={center} cy={center} r={r2}
				stroke="#0ea5e9" strokeWidth={stroke} fill="none"
				strokeDasharray={seg(c2, proteinPct)}
				transform={`rotate(-90 ${center} ${center})`}
				strokeLinecap="round"
			/>
			<circle
				cx={center} cy={center} r={r3}
				stroke="#ec4899" strokeWidth={stroke} fill="none"
				strokeDasharray={seg(c3, fatPct)}
				transform={`rotate(-90 ${center} ${center})`}
				strokeLinecap="round"
			/>
		</svg>
	);
}

