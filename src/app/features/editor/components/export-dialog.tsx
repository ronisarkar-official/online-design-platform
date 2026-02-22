'use client';

import { useState, useCallback, useEffect } from 'react';
import { Editor, JSON_KEYS } from '../types';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Check, Link2, Link2Off, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
	editor: Editor | undefined;
	children?: React.ReactNode;
}

type ExportFormat = 'png' | 'jpg' | 'svg' | 'webp';

export const ExportDialog = ({ editor, children }: ExportDialogProps) => {
	const [open, setOpen] = useState(false);
	const [format, setFormat] = useState<ExportFormat>('png');
	const [quality, setQuality] = useState(90);
	const [filename, setFilename] = useState('my-design');
	const [isExporting, setIsExporting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [exportSuccess, setExportSuccess] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [customWidth, setCustomWidth] = useState(800);
	const [customHeight, setCustomHeight] = useState(600);
	const [originalWidth, setOriginalWidth] = useState(800);
	const [originalHeight, setOriginalHeight] = useState(600);
	const [lockAspectRatio, setLockAspectRatio] = useState(true);
	const [aspectRatio, setAspectRatio] = useState(1);

	// Get original dimensions when dialog opens
	useEffect(() => {
		if (open && editor) {
			const workspace = editor.getWorkspace();
			if (workspace) {
				const w = Math.round(workspace.width || 800);
				const h = Math.round(workspace.height || 600);
				setOriginalWidth(w);
				setOriginalHeight(h);
				setCustomWidth(w);
				setCustomHeight(h);
				setAspectRatio(w / h);
			}
		}
	}, [open, editor]);

	const handleWidthChange = (value: string) => {
		const w = parseInt(value) || 0;
		setCustomWidth(w);
		if (lockAspectRatio && w > 0) {
			setCustomHeight(Math.round(w / aspectRatio));
		}
	};

	const handleHeightChange = (value: string) => {
		const h = parseInt(value) || 0;
		setCustomHeight(h);
		if (lockAspectRatio && h > 0) {
			setCustomWidth(Math.round(h * aspectRatio));
		}
	};

	const resetToOriginal = () => {
		setCustomWidth(originalWidth);
		setCustomHeight(originalHeight);
	};

	const setScale = (scale: number) => {
		setCustomWidth(Math.round(originalWidth * scale));
		setCustomHeight(Math.round(originalHeight * scale));
	};

	const getCurrentScale = () => {
		const widthScale = customWidth / originalWidth;
		const heightScale = customHeight / originalHeight;
		// Check if both dimensions match a preset
		if (Math.abs(widthScale - heightScale) < 0.01) {
			const scale = widthScale;
			if ([1, 2, 4, 8].some((s) => Math.abs(s - scale) < 0.01)) {
				return scale;
			}
		}
		return null;
	};

	const handleExport = useCallback(async () => {
		if (!editor) return;

		setIsExporting(true);
		setExportSuccess(false);

		try {
			const canvas = editor.canvas;
			const workspace = editor.getWorkspace();

			if (!workspace) {
				setIsExporting(false);
				return;
			}

			// Get the original workspace dimensions and position
			const originalWidth = workspace.width || 800;
			const originalHeight = workspace.height || 600;
			const workspaceLeft = workspace.left ?? 0;
			const workspaceTop = workspace.top ?? 0;

			// Save current viewport transform
			const currentTransform = canvas.viewportTransform?.slice() as number[] | undefined;

			// Reset viewport to identity matrix (no zoom/pan)
			canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

			try {
				if (format === 'svg') {
					const svg = canvas.toSVG({
						viewBox: {
							x: workspaceLeft,
							y: workspaceTop,
							width: originalWidth,
							height: originalHeight,
						},
						width: String(customWidth),
						height: String(customHeight),
					});
					const blob = new Blob([svg], { type: 'image/svg+xml' });
					downloadBlob(blob, `${filename}.svg`);
				} else {
					// Calculate multiplier for higher resolution export
					const multiplier = Math.max(customWidth / originalWidth, customHeight / originalHeight, 1);

					// Use toCanvasElement to create an offscreen canvas without affecting the displayed canvas
					const offscreenCanvas = canvas.toCanvasElement(multiplier, {
						left: workspaceLeft,
						top: workspaceTop,
						width: originalWidth,
						height: originalHeight,
					});

					// Restore the original viewport transform IMMEDIATELY after creating offscreen canvas
					if (currentTransform) {
						canvas.setViewportTransform(currentTransform as [number, number, number, number, number, number]);
					}

					// Create a resize canvas to get exact dimensions
					const resizeCanvas = document.createElement('canvas');
					resizeCanvas.width = customWidth;
					resizeCanvas.height = customHeight;
					const ctx = resizeCanvas.getContext('2d');

					if (ctx) {
						ctx.imageSmoothingEnabled = true;
						ctx.imageSmoothingQuality = 'high';
						ctx.drawImage(offscreenCanvas, 0, 0, customWidth, customHeight);

						const dataUrl = resizeCanvas.toDataURL(
							format === 'jpg' ? 'image/jpeg' : `image/${format}`,
							quality / 100
						);
						
						const link = document.createElement('a');
						link.href = dataUrl;
						link.download = `${filename}.${format}`;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					}
				}
			} finally {
				// Ensure transform is restored even if export fails
				// Double check if it needs restoring here or if it was already restored
				// If we threw error before manual restore, this block catches it
				const current = canvas.viewportTransform;
				const isIdentity = current && current[0] === 1 && current[3] === 1 && current[4] === 0 && current[5] === 0;
				if (isIdentity && currentTransform) {
					canvas.setViewportTransform(currentTransform as [number, number, number, number, number, number]);
				}
			}

			setExportSuccess(true);
			setTimeout(() => {
				setExportSuccess(false);
				setOpen(false);
			}, 1200);
		} catch (error) {
			console.error('Export failed:', error);
		} finally {
			setIsExporting(false);
		}
	}, [editor, format, quality, filename, customWidth, customHeight]);

	const downloadBlob = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const supportsQuality = format === 'jpg' || format === 'webp';

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children || (
					<Button
						variant="default"
						size="sm"
						className="gap-2">
						<Download className="size-4" />
						<span>Export</span>
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Download</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					{/* Filename */}
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">Filename</Label>
						<Input
							value={filename}
							onChange={(e) => setFilename(e.target.value)}
							className="h-9"
							placeholder="my-design"
						/>
					</div>

					{/* Format */}
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">File type</Label>
						<Select
							value={format}
							onValueChange={(v) => setFormat(v as ExportFormat)}>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="png">PNG (Transparent)</SelectItem>
								<SelectItem value="jpg">JPG (Compressed)</SelectItem>
								<SelectItem value="webp">WebP (Modern)</SelectItem>
								<SelectItem value="svg">SVG (Vector)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Resolution */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs text-muted-foreground">Size</Label>
							<button
								onClick={resetToOriginal}
								className="text-xs text-primary hover:underline">
								Reset
							</button>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<Input
									type="number"
									value={customWidth}
									onChange={(e) => handleWidthChange(e.target.value)}
									className="h-9 text-center"
									min={1}
									max={8000}
								/>
								<p className="text-[10px] text-muted-foreground text-center mt-1">
									Width
								</p>
							</div>
							<button
								onClick={() => setLockAspectRatio(!lockAspectRatio)}
								className={cn(
									'p-1.5 rounded-md transition-colors',
									lockAspectRatio ?
										'text-primary bg-primary/10'
									:	'text-muted-foreground hover:bg-muted',
								)}>
								{lockAspectRatio ?
									<Link2 className="size-4" />
								:	<Link2Off className="size-4" />}
							</button>
							<div className="flex-1">
								<Input
									type="number"
									value={customHeight}
									onChange={(e) => handleHeightChange(e.target.value)}
									className="h-9 text-center"
									min={1}
									max={8000}
								/>
								<p className="text-[10px] text-muted-foreground text-center mt-1">
									Height
								</p>
							</div>
						</div>
						{/* Scale Presets */}
						<div className="flex items-center gap-1.5 mt-2">
							<span className="text-[10px] text-muted-foreground mr-1">
								Scale:
							</span>
							{[1, 2, 4, 8].map((scale) => (
								<button
									key={scale}
									onClick={() => setScale(scale)}
									className={cn(
										'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
										getCurrentScale() === scale ?
											'bg-primary text-primary-foreground'
										:	'bg-muted hover:bg-muted/80 text-foreground',
									)}>
									{scale}x
								</button>
							))}
						</div>
					</div>

					{/* Quality (for JPG/WebP) */}
					{supportsQuality && (
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">Quality</Label>
								<span className="text-xs font-medium">{quality}%</span>
							</div>
							<Slider
								value={[quality]}
								onValueChange={(values: number[]) => setQuality(values[0])}
								min={10}
								max={100}
								step={5}
								className="w-full"
							/>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex gap-2 mt-2">
						{/* Save Project Button */}
						<Button
							variant="outline"
							onClick={async () => {
								if (!editor) return;
								setIsSaving(true);
								try {
									const canvas = editor.canvas;
									// Get canvas data with custom properties included
									const json = {
										objects: canvas
											.getObjects()
											.map((obj) => obj.toObject(JSON_KEYS)),
										background: canvas.backgroundColor,
									};
									const blob = new Blob([JSON.stringify(json, null, 2)], {
										type: 'application/json',
									});
									downloadBlob(blob, `${filename}.json`);
									setSaveSuccess(true);
									setTimeout(() => setSaveSuccess(false), 1500);
								} finally {
									setIsSaving(false);
								}
							}}
							disabled={isSaving || !editor || !filename.trim()}
							className="flex-1 h-10 gap-2">
							{isSaving ?
								<>
									<Loader2 className="size-4 animate-spin" />
									Saving...
								</>
							: saveSuccess ?
								<>
									<Check className="size-4" />
									Saved!
								</>
							:	<>
									<Save className="size-4" />
									Save Project
								</>
							}
						</Button>

						{/* Download Button */}
						<Button
							onClick={handleExport}
							disabled={isExporting || !editor || !filename.trim()}
							className="flex-1 h-10 gap-2">
							{isExporting ?
								<>
									<Loader2 className="size-4 animate-spin" />
									Exporting...
								</>
							: exportSuccess ?
								<>
									<Check className="size-4" />
									Done!
								</>
							:	<>
									<Download className="size-4" />
									Download
								</>
							}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
