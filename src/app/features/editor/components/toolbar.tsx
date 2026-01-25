'use client';

import * as fabric from 'fabric';
import { memo, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { isTextType } from '../utils';

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
									className={cn(
										activeTool === 'stroke-width' && 'bg-muted',
									)}
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
						{/* Alignment Tools */}
						<div className="flex items-center h-full border-l pl-2 ml-2 gap-x-1">
							<Hint label="Align Left" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const activeObject = editor?.canvas.getActiveObject();
										if (activeObject) {
											// If multiple objects are selected (ActiveSelection)
											if (activeObject.type === 'activeSelection') {
												const selection = activeObject as fabric.ActiveSelection;
												const left = -(selection.width || 0) / 2;
												selection.getObjects().forEach((obj) => {
													obj.set({ left });
													// Adjust for origin if needed, but usually inside group relative coords work like this
													// Actually fabric.js group coords are relative to center.
													// Let's use a simpler approach for single objects vs selection
												});
												// For now let's just support single object alignment to canvas
											} else {
												// Align to canvas
												activeObject.set({ left: 0 });
											}
											editor?.canvas.renderAll();
											editor?.save();
										}
									}}
									aria-label="Align Left"
								>
									<AlignLeft className="size-4" />
								</Button>
							</Hint>
							<Hint label="Align Center" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
									const activeObject = editor?.canvas.getActiveObject();
									if (activeObject && editor?.canvas) {
										// Fabric.js v6: use canvas.centerObjectH() instead of object.centerHorizontally()
										editor.canvas.centerObjectH(activeObject);
										editor.canvas.renderAll();
										editor.save();
									}
								}}
									aria-label="Align Center"
								>
									<AlignCenter className="size-4" />
								</Button>
							</Hint>
							<Hint label="Align Right" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const activeObject = editor?.canvas.getActiveObject();
										if (activeObject && editor?.canvas.width) {
											activeObject.set({ left: editor.canvas.width - (activeObject.width || 0) * (activeObject.scaleX || 1) });
											editor?.canvas.renderAll();
											editor?.save();
										}
									}}
									aria-label="Align Right"
								>
									<AlignRight className="size-4" />
								</Button>
							</Hint>
							<Hint label="Align Top" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const activeObject = editor?.canvas.getActiveObject();
										if (activeObject) {
											activeObject.set({ top: 0 });
											editor?.canvas.renderAll();
											editor?.save();
										}
									}}
									aria-label="Align Top"
								>
									<AlignVerticalJustifyStart className="size-4" />
								</Button>
							</Hint>
							<Hint label="Align Middle" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
									const activeObject = editor?.canvas.getActiveObject();
									if (activeObject && editor?.canvas) {
										// Fabric.js v6: use canvas.centerObjectV() instead of object.centerVertically()
										editor.canvas.centerObjectV(activeObject);
										editor.canvas.renderAll();
										editor.save();
									}
								}}
									aria-label="Align Middle"
								>
									<AlignVerticalJustifyCenter className="size-4" />
								</Button>
							</Hint>
							<Hint label="Align Bottom" side="bottom" sideOffset={5} align="center">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										const activeObject = editor?.canvas.getActiveObject();
										if (activeObject && editor?.canvas.height) {
											activeObject.set({ top: editor.canvas.height - (activeObject.height || 0) * (activeObject.scaleY || 1) });
											editor?.canvas.renderAll();
											editor?.save();
										}
									}}
									aria-label="Align Bottom"
								>
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
