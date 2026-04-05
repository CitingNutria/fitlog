import React from 'react';

type Props = {
	label: string;
	value: number;
	target: number;
	colorClass?: string;
	unit?: string;
};

export function ProgressBar({ label, value, target, colorClass = 'bg-sky-500', unit = 'g' }: Props) {
	const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
	return (
		<div className="space-y-1">
			<div className="flex items-end justify-between text-sm">
				<span className="font-medium">{label}</span>
				<span className="tabular-nums">{Math.round(value)} / {Math.round(target)} {unit}</span>
			</div>
			<div className="h-2 w-full rounded bg-gray-200">
				<div className={`h-2 rounded ${colorClass}`} style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

