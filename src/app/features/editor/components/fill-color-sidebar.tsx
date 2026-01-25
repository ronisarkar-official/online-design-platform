'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ActiveTool, Editor, FILL_COLOR } from '@/app/features/editor/types';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const ColorPicker = dynamic(
	() => import('./color-picker').then((mod) => ({ default: mod.ColorPicker })),
	{ ssr: false },
);

interface FillColorSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

const FillColorSidebarComponent: React.FC<FillColorSidebarProps> = ({
	editor,
	activeTool,
	onChangeActiveTool,
}) => {
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const onClose = useCallback(
		() => onChangeActiveTool('select'),
		[onChangeActiveTool],
	);

	// quick reference to the selected object (avoid repeated deep access)
	const selected = useMemo(
		() => editor?.selectedObjects?.[0],
		[editor?.selectedObjects],
	);

	// computed value: selected fill -> editor fill -> default
	const value = useMemo(
		() => (selected?.fill as string) ?? editor?.fillColor ?? FILL_COLOR,
		[selected, editor?.fillColor],
	);

	const hasSelectedObjects = (editor?.selectedObjects?.length ?? 0) > 0;
	const isOpen = activeTool === 'fill' && hasSelectedObjects;

	// rAF throttle so continuous color moves don't call the editor hundreds of times
	const rafRef = useRef<number | null>(null);
	const latestColorRef = useRef<string | null>(null);

	useEffect(() => {
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			latestColorRef.current = null;
		};
	}, []);

	const commitColorNow = useCallback(
		(color: string) => {
			editor?.changeFillColor(color);
			latestColorRef.current = null;
			if (rafRef.current != null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		},
		[editor],
	);

	const onChange = useCallback(
		(newColor: string) => {
			// schedule a single rAF commit; keep last color in ref
			latestColorRef.current = newColor;
			if (rafRef.current == null) {
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					const c = latestColorRef.current;
					if (c != null) {
						editor?.changeFillColor(c);
						latestColorRef.current = null;
					}
				});
			}
		},
		[editor],
	);

	// robust click-outside: attach only when open
	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			if (!isOpen) return;
			const target = event.target as HTMLElement | null;
			if (!target) return;

			// support shadow DOM / composedPath
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

	// keep mounted and use transform for smooth transitions
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

	// if nothing selected, don't render anything — saves DOM + event work
	if (!hasSelectedObjects) return null;

	return (
		<aside
			ref={sidebarRef}
			className={containerClass}
			aria-hidden={!isOpen}
			role="region"
			aria-label="Fill color sidebar">
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<ColorPicker
						value={value}
						onChange={onChange}
						onCommit={commitColorNow}
					/>
					{/* if your picker doesn't support onCommit, commitColorNow still exists for manual commit points */}
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};

export const FillColorSidebar = memo(FillColorSidebarComponent);
FillColorSidebar.displayName = 'FillColorSidebar';
