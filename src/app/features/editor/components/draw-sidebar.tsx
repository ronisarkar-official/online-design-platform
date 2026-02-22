import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ColorPicker } from './color-picker';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DrawSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const CURSORS = {
	pen: `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20L8 20L20 8L16 4L4 16L4 20Z" fill="black" stroke="white" stroke-width="1.5"/><path d="M16 4L20 8" stroke="white" stroke-width="1.5"/></svg>') 0 24, crosshair`,
	marker: `url('data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="16" width="6" height="6" fill="black" stroke="white"/><rect x="10" y="4" width="10" height="12" fill="none" stroke="black" stroke-width="2"/></svg>') 4 20, crosshair`,
	crosshair: 'crosshair',
};

type BrushType = 'pen' | 'marker' | 'highlighter' | 'spray' | 'circle';

const PenIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M14 4L20 10L8 22H2V16L14 4Z" fill="#E65858" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
		<path d="M14 4L20 10" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
		<path d="M18 6L14 10" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
		<path d="M4 22C4 22 6 18 10 18" stroke="#E65858" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

const MarkerIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="8" width="14" height="8" rx="2" fill="white" stroke="#111" strokeWidth="1.5"/>
		<path d="M16 8L22 10V14L16 16V8Z" fill="#E65858" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
		<path d="M6 12C6 12 7 10 10 10C13 10 13 14 10 14" stroke="#E65858" strokeWidth="1.5" strokeLinecap="round"/>
	</svg>
);

const HighlighterIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="8" width="14" height="8" rx="2" fill="white" stroke="#111" strokeWidth="1.5"/>
		<path d="M16 9L20 9L22 11V15L16 15V9Z" fill="#F4DE4C" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
		<path d="M6 10H10" stroke="#F4DE4C" strokeWidth="2" strokeLinecap="round"/>
	</svg>
);

const MenuIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="3" y="6" width="18" height="3" rx="1.5" fill="white"/>
		<rect x="3" y="12" width="18" height="3" rx="1.5" fill="white"/>
		<rect x="3" y="18" width="18" height="3" rx="1.5" fill="white"/>
	</svg>
);

const SprayIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M12 4V2M12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4ZM8 8L6.5 6.5M16 8L17.5 6.5" stroke="#E65858" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
		<path d="M9 10C7.34315 10 6 11.3431 6 13V22H18V13C18 11.3431 16.6569 10 15 10H9Z" fill="white" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
	</svg>
);

const CircleIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="12" cy="12" r="8" fill="white" stroke="#111" strokeWidth="1.5"/>
		<circle cx="12" cy="12" r="2" fill="#E65858"/>
	</svg>
);

export const DrawSidebar: React.FC<DrawSidebarProps> = ({
	editor,
	activeTool,
	onChangeActiveTool,
}) => {
	const [activeBrush, setActiveBrush] = useState<BrushType>('pen');

	const currentStrokeWidth = useMemo(
		() => editor?.strokeWidth ?? 2,
		[editor?.strokeWidth],
	);

	const strokeColor = useMemo(
		() => editor?.strokeColor ?? '#111111',
		[editor?.strokeColor],
	);

	const [strokeWidth, setStrokeWidth] = useState<number>(currentStrokeWidth);

	useEffect(() => {
		setStrokeWidth(currentStrokeWidth);
	}, [currentStrokeWidth]);

	const sliderValue = useMemo(() => [strokeWidth], [strokeWidth]);

	const rafSliderRef = useRef<number | null>(null);
	const latestSliderRef = useRef<number | null>(null);

	const handleSelectBrush = useCallback((type: BrushType) => {
		setActiveBrush(type);
		if (editor?.changeDrawingBrush) {
			editor.changeDrawingBrush(type, strokeWidth, strokeColor);
		}
	}, [editor, strokeWidth, strokeColor]);

	useEffect(() => {
		return () => {
			if (rafSliderRef.current != null) cancelAnimationFrame(rafSliderRef.current);
		};
	}, []);

	const onSliderValueChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			setStrokeWidth(v);
			latestSliderRef.current = v;

			if (rafSliderRef.current == null) {
				rafSliderRef.current = requestAnimationFrame(() => {
					rafSliderRef.current = null;
					const latest = latestSliderRef.current;
					if (latest != null) {
						editor?.changeStrokeWidth(latest);
						if (editor?.changeDrawingBrush) {
							editor.changeDrawingBrush(activeBrush, latest, strokeColor);
						}
					}
				});
			}
		},
		[editor, activeBrush, strokeColor],
	);

	const rafColorRef = useRef<number | null>(null);
	const latestColorRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (rafColorRef.current != null) cancelAnimationFrame(rafColorRef.current);
		};
	}, []);

	const onColorChange = useCallback(
		(newColor: string) => {
			latestColorRef.current = newColor;

			if (rafColorRef.current == null) {
				rafColorRef.current = requestAnimationFrame(() => {
					rafColorRef.current = null;
					const latestColor = latestColorRef.current;
					if (latestColor != null) {
						editor?.changeStrokeColor(latestColor);
						if (editor?.changeDrawingBrush) {
							editor.changeDrawingBrush(activeBrush, strokeWidth, latestColor);
						}
					}
				});
			}
		},
		[editor, activeBrush, strokeWidth],
	);

// ... (keep BRUSHES outside or inside, let's put it right before the return to capture the handler easily)
	const BRUSHES: { id: BrushType; label: string; icon: React.FC }[] = [
		{ id: 'pen', label: 'Pen', icon: PenIcon },
		{ id: 'marker', label: 'Marker', icon: MarkerIcon },
		{ id: 'highlighter', label: 'Highlighter', icon: HighlighterIcon },
		{ id: 'spray', label: 'Spray Paint', icon: SprayIcon },
		{ id: 'circle', label: 'Dotted', icon: CircleIcon },
	];

	return (
		<AnimatePresence>
			{activeTool === 'draw' && (
				<TooltipProvider>
					<motion.div
						initial={{ opacity: 0, x: -20, y: '-50%' }}
						animate={{ opacity: 1, x: 0, y: '-50%' }}
						exit={{ opacity: 0, x: -20, y: '-50%' }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="absolute left-[70px] top-1/2 bg-[#1A1A1D] rounded-[24px] p-2 flex flex-col items-center gap-1.5 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-[52px] border border-[#2D2D30]"
					>
						{/* Brushes */}
						{BRUSHES.map((brush) => (
							<Tooltip key={brush.id} delayDuration={150}>
								<TooltipTrigger asChild>
									<div className="relative">
										{brush.id === 'marker' && (
											<div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-gray-400 rounded-full border border-[#1A1A1D] z-10" />
										)}
										<button
											onClick={() => handleSelectBrush(brush.id)}
											className={cn(
												"w-10 h-10 flex items-center justify-center rounded-xl transition-all",
												activeBrush === brush.id
													? "bg-[#35363A] scale-[0.98] shadow-inner"
													: "hover:bg-[#2D2D30] hover:scale-|1.02]"
											)}
										>
											<brush.icon />
										</button>
									</div>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={14} className="bg-[#1A1A1D] border-[#2D2D30] text-white rounded-lg">
									{brush.label}
								</TooltipContent>
							</Tooltip>
						))}

						<div className="w-6 h-px bg-[#2D2D30] my-1 rounded-full" /> {/* Divider */}

						{/* Color Picker Popover */}
						<Popover>
							<PopoverTrigger asChild>
								<button className="w-8 h-8 rounded-full border-2 border-[#35363A] shadow-md flex items-center justify-center hover:scale-105 transition-transform" style={{ backgroundColor: strokeColor }}>
									<span className="sr-only">Choose Color</span>
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-80 ml-4 p-4 rounded-xl border-[#2D2D30] bg-[#1A1A1D] text-white" side="right">
								<ColorPicker
									value={strokeColor}
									onChange={onColorChange}
								/>
							</PopoverContent>
						</Popover>

						{/* Stroke Width Slider Popover */}
						<Popover>
							<PopoverTrigger asChild>
								<button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#2D2D30] transition-colors">
									<MenuIcon />
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-64 ml-4 p-4 rounded-xl border-[#2D2D30] bg-[#1A1A1D] text-white" side="right">
								<div className="space-y-4">
									<h4 className="font-medium text-sm">Brush Width ({strokeWidth}px)</h4>
									<Slider
										value={sliderValue}
										onValueChange={onSliderValueChange}
										min={1}
										step={1}
										className="w-full"
									/>
								</div>
							</PopoverContent>
						</Popover>
					</motion.div>
				</TooltipProvider>
			)}
		</AnimatePresence>
	);
};
