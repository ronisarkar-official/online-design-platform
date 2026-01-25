'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ActiveTool, Editor, STROKE_COLOR } from '@/app/features/editor/types';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const ColorPicker = dynamic(
	() => import('./color-picker').then((mod) => ({ default: mod.ColorPicker })),
	{ ssr: false },
);

interface StrokeColorSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

const StrokeColorSidebarComponent: React.FC<StrokeColorSidebarProps> = ({
	editor,
	activeTool,
	onChangeActiveTool,
}) => {
	const sidebarRef = useRef<HTMLDivElement | null>(null);

	const onClose = useCallback(
		() => onChangeActiveTool('select'),
		[onChangeActiveTool],
	);

	const hasSelectedObjects = (editor?.selectedObjects?.length ?? 0) > 0;
	const isOpen = activeTool === 'stroke-color' && hasSelectedObjects;

	// read only the bits we actually care about to reduce re-evaluations
	const value = useMemo(() => {
		const sel = editor?.selectedObjects?.[0];
		// prefer explicit stroke on selected object, then editor strokeColor, then default
		return (sel?.stroke as string) || editor?.strokeColor || STROKE_COLOR;
	}, [editor?.selectedObjects, editor?.strokeColor]);

	// rAF throttling for frequent color updates (many pickers emit lots of events)
	const rafRef = useRef<number | null>(null);
	const latestColorRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			latestColorRef.current = null;
		};
	}, []);

	const onChange = useCallback(
		(newColor: string) => {
			// update references and schedule a single rAF commit
			latestColorRef.current = newColor;
			if (rafRef.current == null) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					const latest = latestColorRef.current;
					if (latest != null) {
						editor?.changeStrokeColor(latest);
						latestColorRef.current = null;
					}
				});
			}
		},
		[editor],
	);

	// click outside: attach listener only when visible
	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			if (!isOpen) return;
			const target = event.target as HTMLElement | null;
			if (!target) return;

			// robust path check for shadow DOM / composedPath support
			const path =
				(event.composedPath && event.composedPath()) ||
				((event as any).path as EventTarget[]) ||
				[];
			const clickedInsideSidebar =
				sidebarRef.current &&
				(path.length
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

	// Keep the element mounted and use transform for smooth slide-in/out animation
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

	// If nothing is selected, don't even attempt to render the sidebar contents
	if (!hasSelectedObjects) return null;

	return (
		<aside
			ref={sidebarRef}
			className={containerClass}
			aria-hidden={!isOpen}
			role="region"
			aria-label="Stroke color sidebar">
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<ColorPicker
						value={value}
						onChange={onChange}
					/>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};

export const StrokeColorSidebar = memo(StrokeColorSidebarComponent);
StrokeColorSidebar.displayName = 'StrokeColorSidebar';
