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

interface OpacitySidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

const OpacitySidebarComponent: React.FC<OpacitySidebarProps> = ({
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
	const isOpen = activeTool === 'opacity' && hasSelectedObjects;

	// derived editor values (memoized)
	const currentOpacity = useMemo(
		() => (editor?.getActiveOpacity() ?? 1) * 100,
		[editor],
	);

	// local UI state (snappy)
	const [opacity, setOpacity] = useState<number>(currentOpacity);

	// keep local in sync when selection or editor changes
	useEffect(() => {
		setOpacity(currentOpacity);
	}, [currentOpacity]);

	// rAF commit pattern (smooth, low overhead)
	const latestOpacityRef = useRef<number | null>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			latestOpacityRef.current = null;
		};
	}, []);

	// stable slider handlers: avoid creating inline arrays/ lambdas in JSX
	const sliderValue = useMemo(() => [opacity], [opacity]);

	const commitOpacityNow = useCallback(
		(value: number) => {
			// final commit to editor (synchronous call)
			editor?.changeOpacity(value / 100);
			latestOpacityRef.current = null;
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
			setOpacity(v);
			latestOpacityRef.current = v;

			if (rafRef.current == null) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					const latest = latestOpacityRef.current;
					if (latest != null) {
						editor?.changeOpacity(latest / 100);
						latestOpacityRef.current = null;
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
			commitOpacityNow(v);
		},
		[commitOpacityNow],
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
			aria-label="Opacity">
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-medium">Opacity</label>
						<Slider
							value={sliderValue} // stable memoized array
							onValueChange={onSliderValueChange} // stable callback
							// If your Slider supports it, this ensures final commit on release:
							// If it doesn't exist, harmless extra prop will be ignored by TS/JS runtime depending on your Slider impl.
							onValueCommit={onSliderValueCommit}
							min={0}
							max={100}
							step={1}
							className="w-full"
						/>
						<div className="text-xs text-muted-foreground text-center">
							{opacity}%
						</div>
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};

export const OpacitySidebar = React.memo(OpacitySidebarComponent);
OpacitySidebar.displayName = 'OpacitySidebar';
