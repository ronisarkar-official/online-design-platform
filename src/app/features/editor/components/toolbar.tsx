'use client';

import * as fabric from 'fabric';
import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover';
import { ActiveTool, Editor } from '../types';
import { Hint } from '@/components/hint';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BsBorderWidth } from 'react-icons/bs';
import { RxTransparencyGrid } from 'react-icons/rx';
import {
	Filter,
	FlipHorizontal,
	Radius,
	Crop,
	Scissors,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignVerticalJustifyStart,
	AlignVerticalJustifyCenter,
	AlignVerticalJustifyEnd,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Space,
} from 'lucide-react';
import { isTextType } from '../utils';
import { Slider } from '@/components/ui/slider';

interface ToolbarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}
// ... (rest of the file until the alignment section)

// I will just replace the imports and the alignment section usage.
// Since replace_file_content works on chunks, I'll do two replacements.
// One for imports, one for the usage.
// Actually, I can do it in one go if I use multi_replace_file_content.


export const Toolbar = memo(function Toolbar({
	editor,
	activeTool,
	onChangeActiveTool,
}: ToolbarProps) {
	// Memoize selection and editor-driven values so we don’t recompute every render
	const selected = useMemo(
		() => editor?.selectedObjects?.[0],
		[editor?.selectedObjects],
	);

	const hasSelectedObjects = !!selected;
	const selectedType = selected?.type;

	const isSidebarOpen = useMemo(
		() =>
			activeTool === 'shapes' ||
			activeTool === 'fill' ||
			activeTool === 'stroke-color' ||
			activeTool === 'stroke-width' ||
			activeTool === 'font' ||
			activeTool === 'opacity',
		[activeTool],
	);

	const isText = useMemo(() => isTextType(selectedType), [selectedType]);
	const isImage = useMemo(() => selectedType === 'image', [selectedType]);

	const fillColor = useMemo(
		() =>
			(selected?.fill as string | undefined) ??
			(editor?.fillColor as string | undefined) ??
			'#000000',
		[selected, editor?.fillColor],
	);

	const strokeColor = useMemo(
		() =>
			(selected?.stroke as string | undefined) ??
			(editor?.strokeColor as string | undefined) ??
			'#000000',
		[selected, editor?.strokeColor],
	);

	const fontFamily = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return maybeText?.fontFamily ?? editor?.fontFamily ?? 'Arial';
	}, [selected, editor?.fontFamily]);

	const fontSize = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return (maybeText?.get('fontSize' as keyof fabric.IText) as number | undefined) ?? 32;
	}, [selected]);

	const isBold = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return (maybeText?.get('fontWeight' as keyof fabric.IText) as string | undefined) === 'bold';
	}, [selected]);

	const isItalic = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return (maybeText?.get('fontStyle' as keyof fabric.IText) as string | undefined) === 'italic';
	}, [selected]);

	const isUnderline = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return !!(maybeText?.get('underline' as keyof fabric.IText) as boolean | undefined);
	}, [selected]);

	const isStrikethrough = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return !!(maybeText?.get('linethrough' as keyof fabric.IText) as boolean | undefined);
	}, [selected]);

	const letterSpacing = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		// Fabric stores charSpacing in units of 1/1000 em; map to readable px-like value
		const raw = (maybeText?.get('charSpacing' as keyof fabric.IText) as number | undefined) ?? 0;
		return raw;
	}, [selected]);

	const lineHeight = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		const raw = (maybeText?.get('lineHeight' as keyof fabric.IText) as number | undefined) ?? 1.16;
		return raw;
	}, [selected]);

	// Precompute tiny style objects once per render, not inline in JSX
	const fillSwatchStyle = useMemo(
		() => ({ backgroundColor: fillColor }),
		[fillColor],
	);
	const strokeSwatchStyle = useMemo(
		() => ({ borderColor: strokeColor }),
		[strokeColor],
	);
	const fontPreviewStyle = useMemo(() => ({ fontFamily }), [fontFamily]);

	// Stable handlers
	const openFill = useCallback(
		() => onChangeActiveTool('fill'),
		[onChangeActiveTool],
	);
	const openStrokeColor = useCallback(
		() => onChangeActiveTool('stroke-color'),
		[onChangeActiveTool],
	);
	const openStrokeWidth = useCallback(
		() => onChangeActiveTool('stroke-width'),
		[onChangeActiveTool],
	);
	const openFont = useCallback(
		() => onChangeActiveTool('font'),
		[onChangeActiveTool],
	);
	const openOpacity = useCallback(
		() => onChangeActiveTool('opacity'),
		[onChangeActiveTool],
	);
	const openFilter = useCallback(
		() => onChangeActiveTool('filter'),
		[onChangeActiveTool],
	);
	const openFlipRotate = useCallback(
		() => onChangeActiveTool('flip-rotate'),
		[onChangeActiveTool],
	);
	const openCornerRadius = useCallback(
		() => onChangeActiveTool('corner-radius'),
		[onChangeActiveTool],
	);
	const openCrop = useCallback(
		() => onChangeActiveTool('crop'),
		[onChangeActiveTool],
	);
	const openRemoveBg = useCallback(
		() => onChangeActiveTool('remove-bg'),
		[onChangeActiveTool],
	);

	const [fontSizeInput, setFontSizeInput] = useState(String(fontSize));

	// Keep input in sync when canvas selection changes
	useEffect(() => {
		setFontSizeInput(String(fontSize));
	}, [fontSize]);

	const applyFontSize = useCallback(
		(raw: string) => {
			if (!editor) return;
			const obj = editor.canvas.getActiveObject() as fabric.IText | null;
			if (!obj) return;
			const parsed = parseInt(raw, 10);
			if (!isNaN(parsed) && parsed >= 1) {
				obj.set({ fontSize: parsed } as Partial<fabric.IText>);
				obj.setCoords();
				editor.canvas.renderAll();
				editor.save();
				setFontSizeInput(String(parsed));
			} else {
				// reset to current canvas value on bad input
				const current = (obj.get('fontSize' as keyof fabric.IText) as number | undefined) ?? 32;
				setFontSizeInput(String(current));
			}
		},
		[editor],
	);

	const decreaseFontSize = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = (obj.get('fontSize' as keyof fabric.IText) as number | undefined) ?? 32;
		const next = Math.max(1, current - 1);
		obj.set({ fontSize: next } as Partial<fabric.IText>);
		obj.setCoords();
		editor.canvas.renderAll();
		editor.save();
		setFontSizeInput(String(next));
	}, [editor]);

	const increaseFontSize = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = (obj.get('fontSize' as keyof fabric.IText) as number | undefined) ?? 32;
		const next = current + 1;
		obj.set({ fontSize: next } as Partial<fabric.IText>);
		obj.setCoords();
		editor.canvas.renderAll();
		editor.save();
		setFontSizeInput(String(next));
	}, [editor]);

	const toggleBold = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = (obj.get('fontWeight' as keyof fabric.IText) as string | undefined);
		obj.set({ fontWeight: current === 'bold' ? 'normal' : 'bold' } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	const toggleItalic = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = (obj.get('fontStyle' as keyof fabric.IText) as string | undefined);
		obj.set({ fontStyle: current === 'italic' ? 'normal' : 'italic' } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	const toggleUnderline = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = !!(obj.get('underline' as keyof fabric.IText) as boolean | undefined);
		obj.set({ underline: !current } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	const toggleStrikethrough = useCallback(() => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		const current = !!(obj.get('linethrough' as keyof fabric.IText) as boolean | undefined);
		obj.set({ linethrough: !current } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	const changeLetterSpacing = useCallback((value: number) => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		obj.set({ charSpacing: value } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	const changeLineHeight = useCallback((value: number) => {
		if (!editor) return;
		const obj = editor.canvas.getActiveObject() as fabric.IText | null;
		if (!obj) return;
		obj.set({ lineHeight: value } as Partial<fabric.IText>);
		editor.canvas.renderAll();
		editor.save();
	}, [editor]);

	// Text spacing dropdown state
	const [spacingOpen, setSpacingOpen] = useState(false);
	const spacingRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!spacingOpen) return;
		const handleOutside = (e: MouseEvent) => {
			if (spacingRef.current && !spacingRef.current.contains(e.target as Node)) {
				setSpacingOpen(false);
			}
		};
		document.addEventListener('mousedown', handleOutside);
		return () => document.removeEventListener('mousedown', handleOutside);
	}, [spacingOpen]);

	return (
		<div
			className={cn(
				'px-8',
				!hasSelectedObjects && 'invisible',
				isSidebarOpen ? '' : '', // keep for future conditional classes; no stray booleans
			)}
			data-toolbar>
			<div className="shrink-0 h-[46px] mt-1 border-b bg-background w-fit flex items-center m-auto overflow-x-auto p-2 gap-x-2 rounded-2xl">
				{hasSelectedObjects && (
					<div className="flex items-center gap-x-2 h-full">
						{/* Fill Color - Hide for images */}
						{!isImage && (
							<Hint
								label="Fill Color"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={openFill}
									className={cn(activeTool === 'fill' && 'bg-muted')}
									aria-label="Fill color">
									<div
										className="rounded-sm size-4 border"
										style={fillSwatchStyle}
									/>
								</Button>
							</Hint>
						)}

						{/* Stroke Color - Hide for images */}
						{!isImage && (
							<Hint
								label="Stroke Color"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={openStrokeColor}
									className={cn(activeTool === 'stroke-color' && 'bg-muted')}
									aria-label="Stroke color">
									<div
										className="rounded-sm size-4 border-2"
										style={strokeSwatchStyle}
									/>
								</Button>
							</Hint>
						)}

						{/* Stroke Width - Hide for images */}
						{!isImage && (
							<Hint
								label="Stroke Width"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={openStrokeWidth}
									className={cn(activeTool === 'stroke-width' && 'bg-muted')}
									aria-label="Stroke width">
									<BsBorderWidth className="size-4" />
								</Button>
							</Hint>
						)}

						<Hint
							label="Opacity"
							side="bottom"
							sideOffset={5}
							align="center">
							<Button
								variant="ghost"
								size="icon"
								onClick={openOpacity}
								className={cn(activeTool === 'opacity' && 'bg-muted')}
								aria-label="Opacity">
								<RxTransparencyGrid className="size-4" />
							</Button>
						</Hint>

						{/* Text-specific tools */}
						{isText && (
							<Hint
								label="Font Family"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={openFont}
									className={cn(activeTool === 'font' && 'bg-muted')}
									aria-label="Font family"
									title={fontFamily}>
									<span
										className="text-xs font-bold"
										style={fontPreviewStyle}>
										Aa
									</span>
								</Button>
							</Hint>
						)}

						{/* Font Size stepper - text only */}
						{isText && (
							<div className="flex items-center gap-x-1 border rounded-md px-1">
								<Hint
									label="Decrease font size"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-base"
										onClick={decreaseFontSize}
										aria-label="Decrease font size">
										−
									</Button>
								</Hint>
								<input
									type="text"
									inputMode="numeric"
									value={fontSizeInput}
									onChange={(e) => setFontSizeInput(e.target.value)}
									onBlur={() => applyFontSize(fontSizeInput)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.currentTarget.blur();
										} else if (e.key === 'Escape') {
											setFontSizeInput(String(fontSize));
											e.currentTarget.blur();
										}
									}}
									className="w-9 text-center text-xs font-medium bg-transparent border-0 outline-none focus:bg-muted rounded tabular-nums p-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
								/>
								<Hint
									label="Increase font size"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-base"
										onClick={increaseFontSize}
										aria-label="Increase font size">
										+
									</Button>
								</Hint>
							</div>
						)}

						{/* Text formatting: Bold / Italic / Underline / Strikethrough */}
						{isText && (
							<div className="flex items-center h-full border-l pl-2 ml-1 gap-x-0.5">
								<Hint
									label="Bold"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={toggleBold}
										className={cn('h-7 w-7', isBold && 'bg-muted')}
										aria-label="Bold"
										aria-pressed={isBold}>
										<Bold className="size-3.5" />
									</Button>
								</Hint>
								<Hint
									label="Italic"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={toggleItalic}
										className={cn('h-7 w-7', isItalic && 'bg-muted')}
										aria-label="Italic"
										aria-pressed={isItalic}>
										<Italic className="size-3.5" />
									</Button>
								</Hint>
								<Hint
									label="Underline"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={toggleUnderline}
										className={cn('h-7 w-7', isUnderline && 'bg-muted')}
										aria-label="Underline"
										aria-pressed={isUnderline}>
										<Underline className="size-3.5" />
									</Button>
								</Hint>
								<Hint
									label="Strikethrough"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={toggleStrikethrough}
										className={cn('h-7 w-7', isStrikethrough && 'bg-muted')}
										aria-label="Strikethrough"
										aria-pressed={isStrikethrough}>
										<Strikethrough className="size-3.5" />
									</Button>
								</Hint>
							</div>
						)}

						{isText && (
							<div
								ref={spacingRef}
								className="relative flex items-center h-full border-l pl-2 ml-1">
								<Popover>
									<Hint
										label="Text Spacing"
										side="bottom"
										sideOffset={5}
										align="center">
										<PopoverTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7"
												aria-label="Text Spacing">
												<Space className="size-3.5" />
											</Button>
										</PopoverTrigger>
									</Hint>

									<PopoverContent
										align="start"
										sideOffset={8}
										className="w-64 p-4 space-y-5">
										{/* Letter Spacing */}
										<div className="space-y-2">
											<span className="text-xs font-medium">
												Letter Spacing
											</span>

											<div className="flex items-center gap-2">
												<Button
													size="icon"
													variant="outline"
													onClick={() =>
														changeLetterSpacing(letterSpacing - 12)
													}>
													−
												</Button>

												<div className="flex-1 text-center border rounded py-1 text-sm">
													{letterSpacing}
												</div>

												<Button
													size="icon"
													variant="outline"
													onClick={() =>
														changeLetterSpacing(letterSpacing + 12)
													}>
													+
												</Button>
											</div>
										</div>

										{/* Line Height */}
										<div className="space-y-2">
											<span className="text-xs font-medium">Line Height</span>

											<div className="flex items-center gap-2">
												<Button
													size="icon"
													variant="outline"
													onClick={() =>
														changeLineHeight(
															Math.max(0.5, +(lineHeight - 0.1).toFixed(2)),
														)
													}>
													−
												</Button>

												<div className="flex-1 text-center border rounded py-1 text-sm">
													{lineHeight.toFixed(2)}
												</div>

												<Button
													size="icon"
													variant="outline"
													onClick={() =>
														changeLineHeight(
															Math.min(4, +(lineHeight + 0.1).toFixed(2)),
														)
													}>
													+
												</Button>
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</div>
						)}

						{/* Image-specific tools */}
						{isImage && (
							<>
								<Hint
									label="Filters"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={openFilter}
										className={cn(activeTool === 'filter' && 'bg-muted')}
										aria-label="Filters">
										<Filter className="size-4" />
									</Button>
								</Hint>

								<Hint
									label="Flip & Rotate"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={openFlipRotate}
										className={cn(activeTool === 'flip-rotate' && 'bg-muted')}
										aria-label="Flip & Rotate">
										<FlipHorizontal className="size-4" />
									</Button>
								</Hint>

								<Hint
									label="Corner Radius"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={openCornerRadius}
										className={cn(activeTool === 'corner-radius' && 'bg-muted')}
										aria-label="Corner Radius">
										<Radius className="size-4" />
									</Button>
								</Hint>

								<Hint
									label="Crop Image"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={openCrop}
										className={cn(activeTool === 'crop' && 'bg-muted')}
										aria-label="Crop">
										<Crop className="size-4" />
									</Button>
								</Hint>

								<Hint
									label="Remove Background"
									side="bottom"
									sideOffset={5}
									align="center">
									<Button
										variant="ghost"
										size="icon"
										onClick={openRemoveBg}
										className={cn(activeTool === 'remove-bg' && 'bg-muted')}
										aria-label="Remove Background">
										<Scissors className="size-4" />
									</Button>
								</Hint>
							</>
						)}
						{/* ── Alignment Tools (workspace-relative) ── */}
						<div className="flex items-center h-full border-l pl-2 ml-2 gap-x-1">
							<Hint
								label="Align Left"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsLeft = ws.left ?? 0;
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const offsetX = (obj.left ?? 0) - bound.left;
											obj.set({ left: wsLeft + offsetX });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Left">
									<AlignLeft className="size-4" />
								</Button>
							</Hint>
							<Hint
								label="Align Center"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsLeft = ws.left ?? 0;
										const wsW = ws.width ?? 0;
										const wsCenterX = wsLeft + wsW / 2;
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const objCenterX = bound.left + bound.width / 2;
											const offsetX = (obj.left ?? 0) - objCenterX;
											obj.set({ left: wsCenterX + offsetX });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Center">
									<AlignCenter className="size-4" />
								</Button>
							</Hint>
							<Hint
								label="Align Right"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsRight = (ws.left ?? 0) + (ws.width ?? 0);
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const offsetX =
												(obj.left ?? 0) - (bound.left + bound.width);
											obj.set({ left: wsRight + offsetX });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Right">
									<AlignRight className="size-4" />
								</Button>
							</Hint>
							<Hint
								label="Align Top"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsTop = ws.top ?? 0;
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const offsetY = (obj.top ?? 0) - bound.top;
											obj.set({ top: wsTop + offsetY });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Top">
									<AlignVerticalJustifyStart className="size-4" />
								</Button>
							</Hint>
							<Hint
								label="Align Middle"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsTop = ws.top ?? 0;
										const wsH = ws.height ?? 0;
										const wsCenterY = wsTop + wsH / 2;
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const objCenterY = bound.top + bound.height / 2;
											const offsetY = (obj.top ?? 0) - objCenterY;
											obj.set({ top: wsCenterY + offsetY });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Middle">
									<AlignVerticalJustifyCenter className="size-4" />
								</Button>
							</Hint>
							<Hint
								label="Align Bottom"
								side="bottom"
								sideOffset={5}
								align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const ws = editor?.getWorkspace() as
											| fabric.Rect
											| undefined;
										if (!ws || !editor) return;
										const wsBottom = (ws.top ?? 0) + (ws.height ?? 0);
										const objects = editor.canvas.getActiveObjects();
										objects.forEach((obj) => {
											const bound = obj.getBoundingRect();
											const offsetY =
												(obj.top ?? 0) - (bound.top + bound.height);
											obj.set({ top: wsBottom + offsetY });
											obj.setCoords();
										});
										editor.canvas.renderAll();
										editor.save();
									}}
									aria-label="Align Bottom">
									<AlignVerticalJustifyEnd className="size-4" />
								</Button>
							</Hint>
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
