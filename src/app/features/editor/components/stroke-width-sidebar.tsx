'use client';

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface StrokeWidthSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

/** cheap array equality for small numeric arrays */
const arraysEqual = (a?: number[] | null, b?: number[] | null) => {
	if (a === b) return true;
	if (!a || !b) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
};

const dashPatternDefaults = [
	{ label: 'Solid', value: [] as number[] },
	{ label: 'Dashed', value: [5, 5] as number[] },
	{ label: 'Dotted', value: [1, 1] as number[] },
	{ label: 'Dash-Dot', value: [5, 2, 1, 2] as number[] },
];

const StrokeWidthSidebarComponent: React.FC<StrokeWidthSidebarProps> = ({
	editor,
	activeTool,
	onChangeActiveTool,
}) => {
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const onClose = useCallback(
		() => onChangeActiveTool('select'),
		[onChangeActiveTool],
	);

	// show only when it's the active tool and something is selected
	const hasSelectedObjects = (editor?.selectedObjects?.length ?? 0) > 0;
	const isOpen = activeTool === 'stroke-width' && hasSelectedObjects;

	// derived editor values (memoized)
	const strokeColor = useMemo(
		() => editor?.getActiveStrokeColor() ?? '#000000',
		[editor],
	);
	const strokeDashArray = useMemo(
		() => editor?.getActiveStrokeDashArray() ?? [],
		[editor],
	);
	const currentStrokeWidth = useMemo(
		() => editor?.getActiveStrokeWidth() ?? 2,
		[editor],
	);

	// local UI state (snappy)
	const [strokeWidth, setStrokeWidth] = useState<number>(currentStrokeWidth);

	// keep local in sync when selection or editor changes
	useEffect(() => {
		setStrokeWidth(currentStrokeWidth);
	}, [currentStrokeWidth]);

	// rAF commit pattern (smooth, low overhead)
	const latestWidthRef = useRef<number | null>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			latestWidthRef.current = null;
		};
	}, []);

	// stable slider handlers: avoid creating inline arrays/ lambdas in JSX
	const sliderValue = useMemo(() => [strokeWidth], [strokeWidth]);

	const commitWidthNow = useCallback(
		(value: number) => {
			// final commit to editor (synchronous call)
			editor?.changeStrokeWidth(value);
			latestWidthRef.current = null;
			if (rafRef.current != null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		},
		[editor],
	);

	const onSliderValueChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			setStrokeWidth(v);
			latestWidthRef.current = v;

			if (rafRef.current == null) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					const latest = latestWidthRef.current;
					if (latest != null) {
						editor?.changeStrokeWidth(latest);
						latestWidthRef.current = null;
					}
				});
			}
		},
		[editor],
	);

	// Some slider libraries provide an onValueCommit / onValueEnd callback (fires on mouse up/touch end).
	// If your Slider supports it, we use it to guarantee a final commit and cancel any pending rAF.
	const onSliderValueCommit = useCallback(
		(values: number[]) => {
			const v = values[0];
			commitWidthNow(v);
		},
		[commitWidthNow],
	);

	// click outside handling: attach listener only while visible
	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			if (!isOpen) return;
			const target = event.target as HTMLElement | null;
			if (!target) return;
			const path = event.composedPath
				? (event.composedPath() as EventTarget[])
				: (event as any).path;
			const clickedInsideSidebar =
				sidebarRef.current &&
				(path
					? path.includes(sidebarRef.current)
					: sidebarRef.current.contains(target));
			const clickedCanvas =
				!!target.closest?.('canvas') || target.tagName === 'CANVAS';
			const clickedToolbar = !!target.closest?.('[data-toolbar]');

			if (!clickedInsideSidebar && !clickedCanvas && !clickedToolbar) {
				onClose();
			}
		},
		[isOpen, onClose],
	);

	useEffect(() => {
		if (!isOpen) return;
		document.addEventListener('mousedown', handleClickOutside, {
			passive: true,
		});
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, handleClickOutside]);

	// patterns memoized along with preview styles so we don't recreate inline objects in render
	const dashPatterns = useMemo(() => dashPatternDefaults, []);
	const patternPreviewStyles = useMemo(
		() =>
			dashPatterns.map((p) => ({
				borderTopColor: strokeColor,
				borderTopStyle: p.value.length > 0 ? 'dashed' : 'solid',
				borderTopWidth: '2px',
			})),
		[dashPatterns, strokeColor],
	);

	const handlePatternClick = useCallback(
		(pattern: number[]) => {
			editor?.changeStrokeDashArray(pattern);
		},
		[editor],
	);

	// slide-in/out with transform so the DOM remains mounted and transitions feel smooth
	const containerClass = useMemo(
		() =>
			cn(
				'w-full md:w-[360px] h-fit bg-background absolute left-0 md:left-[60px] mt-1 border-r border-border shadow-xl rounded-xl z-40 flex flex-col top-[56px] transform transition-transform duration-180 ease-out',
				isOpen
					? 'translate-x-0 opacity-100'
					: '-translate-x-full opacity-0 pointer-events-none',
			),
		[isOpen],
	);

	if (!hasSelectedObjects) {
		// short-circuit render: keep DOM minimal when no selection
		return null;
	}

	return (
		<aside
			ref={sidebarRef}
			className={containerClass}
			aria-hidden={!isOpen}
			role="region"
			aria-label="Stroke width">
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-medium">Stroke Width</label>
						<Slider
							value={sliderValue} // stable memoized array
							onValueChange={onSliderValueChange} // stable callback
							// If your Slider supports it, this ensures final commit on release:
							// If it doesn't exist, harmless extra prop will be ignored by TS/JS runtime depending on your Slider impl.
							onValueCommit={onSliderValueCommit}
							min={0}
							max={30}
							step={1}
							className="w-full"
						/>
						<div className="text-xs text-muted-foreground text-center">
							{strokeWidth}px
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Stroke Style</label>
						<div className="grid grid-cols-2 gap-2">
							{dashPatterns.map((pattern, idx) => {
								const active = arraysEqual(strokeDashArray, pattern.value);
								return (
									<Button
										key={pattern.label}
										variant={active ? 'default' : 'outline'}
										size="sm"
										onClick={() => handlePatternClick(pattern.value)}
										className="text-xs flex items-center gap-2">
										<div
											className="w-8 h-0.5"
											style={patternPreviewStyles[idx]}
										/>
										{pattern.label}
									</Button>
								);
							})}
						</div>
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};

export const StrokeWidthSidebar = React.memo(StrokeWidthSidebarComponent);
StrokeWidthSidebar.displayName = 'StrokeWidthSidebar';
