'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import * as fabric from 'fabric';
import { ActiveTool, Editor, fonts, FONT_FAMILY } from '@/app/features/editor/types';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { isTextType } from '../utils';

interface FontSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

const FontSidebarComponent: React.FC<FontSidebarProps> = ({
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

	// computed value: selected font -> editor font -> default
	const value = useMemo(
		() => {
			const maybeText = selected as fabric.IText | undefined;
			return maybeText?.fontFamily ?? editor?.fontFamily ?? FONT_FAMILY;
		},
		[selected, editor?.fontFamily],
	);

	const hasSelectedObjects = (editor?.selectedObjects?.length ?? 0) > 0;
	const isTextSelected = selected ? isTextType(selected.type) : false;
	const isOpen = activeTool === 'font' && hasSelectedObjects && isTextSelected;

	const onChangeFontFamily = useCallback(
		(fontFamily: string) => {
			editor?.changeFontFamily(fontFamily);
		},
		[editor],
	);

	// click outside handling: attach listener only while visible
	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			if (!isOpen) return;
			const target = event.target as HTMLElement | null;
			if (!target) return;
			const path =
				(event.composedPath && event.composedPath()) ||
				((event as MouseEvent & { path?: EventTarget[] }).path as EventTarget[]) ||
				[];
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

	// if nothing selected, don't render anything — saves DOM + event work
	if (!hasSelectedObjects) return null;

	return (
		<aside
			ref={sidebarRef}
			className={containerClass}
			aria-hidden={!isOpen}
			role="region"
			aria-label="Font family">
			<ScrollArea className="h-[400px]">
				<div className="p-4">
					<div className="mb-4">
						<label className="text-sm font-medium">Font Family</label>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{fonts.map((font) => {
							const isActive = value === font;
							return (
								<Button
									key={font}
									variant={isActive ? 'default' : 'outline'}
									size="sm"
									onClick={() => onChangeFontFamily(font)}
									className="h-auto p-3 flex flex-col items-center justify-center text-xs">
									<span
										className="text-sm font-medium truncate w-full text-center"
										style={{ fontFamily: font }}>
										Aa
									</span>
									<span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
										{font}
									</span>
								</Button>
							);
						})}
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};

export const FontSidebar = memo(FontSidebarComponent);
FontSidebar.displayName = 'FontSidebar';
