'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveTool, JSON_KEYS } from '@/app/features/editor/types';
import { useEditor } from '@/app/features/editor/hooks/use-editor';
import * as fabric from 'fabric';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { ShapeSidebar } from './shape-sidebar';
import { DrawSidebar } from './draw-sidebar';
import { FillColorSidebar } from './fill-color-sidebar';
import { StrokeColorSidebar } from './stroke-color-sidebar';
import { Footer } from './footer';
import { ContextMenuCanvas } from './context-menu-canvas';
import { TextSidebar } from './text-sidebar';
import { StrokeWidthSidebar } from './stroke-width-sidebar';
import { OpacitySidebar } from './opacity-sidebar';
import { FontSidebar } from './font-sidebar';
import { ImageSidebar } from './image-sidebar';
import { FilterSidebar } from './filter-sidebar';
import { FlipRotateSidebar } from './flip-rotate-sidebar';
import { CornerRadiusSidebar } from './corner-radius-sidebar';
import { CropSidebar } from './crop-sidebar';
import { RemoveBgSidebar } from './remove-bg-sidebar';
import { StickersSidebar } from './stickers-sidebar';

import { LayersSidebar } from './layers-sidebar';
import { UploadSidebar } from './upload-sidebar';
import { SettingsSidebar } from './settings-sidebar';
import { AiSidebar } from './ai-sidebar';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
import { projectStorage } from '@/app/features/projects/storage';

interface EditorProps {
	projectId?: string;
	defaultWidth?: number;
	defaultHeight?: number;
}

export const Editor: React.FC<EditorProps> = ({ projectId, defaultWidth, defaultHeight }) => {
	const [activeTool, setActiveTool] = useState<ActiveTool>('select');

	const { init, editor } = useEditor({
		defaultWidth,
		defaultHeight,
	});
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);

	const initializedProject = useRef<string | null>(null);
	const [isSaved, setIsSaved] = useState(true);

	// Load project data if projectId is provided
	useEffect(() => {
		if (projectId && editor && initializedProject.current !== projectId) {
			const project = projectStorage.getById(projectId);
			if (project && project.canvasData) {
				initializedProject.current = projectId;
				const jsonString = typeof project.canvasData === 'string' 
					? project.canvasData 
					: JSON.stringify(project.canvasData);
				editor.loadJson(jsonString);
				setIsSaved(true); // loaded state is "saved"
			} else {
				// Mark as initialized even if no canvas data exists yet
				initializedProject.current = projectId;
			}
		}
	}, [projectId, editor]);

	// Auto-save functionality — depend on canvas (stable) not editor (recreated often)
	const canvas = editor?.canvas;

	useEffect(() => {
		if (!projectId || !canvas) return;

		const saveProject = async () => {
			// @ts-expect-error toJSON accepts an array of properties to include
			const json = canvas.toJSON(JSON_KEYS);

			// Generate thumbnail using Fabric's native toDataURL
			const width = canvas.width || 800;
			const multiplier = 400 / width;
			const thumbnail = canvas.toDataURL({
				format: 'jpeg',
				quality: 0.7,
				multiplier: multiplier,
			});

			const project = projectStorage.getById(projectId);
			if (project) {
				projectStorage.save({
					...project,
					canvasData: json,
					thumbnailData: thumbnail,
					updatedAt: Date.now(),
				});
			}
			setIsSaved(true);
		};

		let timeoutId: NodeJS.Timeout;
		const debouncedSave = () => {
			setIsSaved(false);
			clearTimeout(timeoutId);
			timeoutId = setTimeout(saveProject, 1000);
		};

		// Listen to canvas events
		canvas.on('object:modified', debouncedSave);
		canvas.on('object:added', debouncedSave);
		canvas.on('object:removed', debouncedSave);
		canvas.on('path:created', debouncedSave); // For drawing mode

		return () => {
			clearTimeout(timeoutId);
			canvas.off('object:modified', debouncedSave);
			canvas.off('object:added', debouncedSave);
			canvas.off('object:removed', debouncedSave);
			canvas.off('path:created', debouncedSave);
		};
	}, [projectId, canvas]);

	const onChangeActiveTool = useCallback(
		(tool: ActiveTool) => {
			if (tool === 'draw') {
				editor?.enableDrawingMode();
			}
			if (activeTool === 'draw') {
				editor?.disableDrawingMode();
			}
			if (tool === activeTool) {
				return setActiveTool('select');
			}
			setActiveTool(tool);
		},
		[activeTool, editor],
	);

	// Automatically switch to select tool when no objects are selected and fill/stroke tool is active
	useEffect(() => {
		const selectedObjects = editor?.selectedObjects;
		const hasSelectedObjects = selectedObjects ? selectedObjects.length > 0 : false;
		if (
			!hasSelectedObjects &&
			(activeTool === 'fill' ||
			activeTool === 'stroke-color' ||
			activeTool === 'filter' ||
			activeTool === 'flip-rotate' ||
			activeTool === 'corner-radius' ||
			activeTool === 'crop' ||
			activeTool === 'remove-bg')
		) {
			// eslint-disable-next-line
			setActiveTool('select');
		}
	}, [editor?.selectedObjects, activeTool]);

	useEffect(() => {
		const canvasEl = canvasRef.current;
		const container = containerRef.current;
		if (!canvasEl || !container) return;

		// prevent double-init if effect re-runs
		if (fabricRef.current) return;

		const canvas = new fabric.Canvas(canvasEl, {
			controlsAboveOverlay: true,
			preserveObjectStacking: true,
			selectionColor: 'rgba(59, 130, 246, 0.2)',
			selectionBorderColor: '#3b82f6',
			selectionLineWidth: 1,
			// any other global Fabric options you rely on
		});
		fabricRef.current = canvas;

		// hand canvas back to your hook/init
		init({ initialCanvas: canvas, initialContainer: container });

		// cleanup on unmount
		return () => {
			// fabric.Canvas#dispose cleans listeners and DOM references
			if (fabricRef.current) {
				fabricRef.current.dispose();
				fabricRef.current = null;
			}
		};
		// intentionally depend on `init` to follow original contract; guard avoids re-init
	}, [init]);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();

			if (!editor) return;

			// Handle URL drop
			const url = e.dataTransfer.getData('text/uri-list');
			if (url) {
				editor.addImage(url);
				return;
			}

			// Handle file drop
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				const file = e.dataTransfer.files[0];
				if (file.type.startsWith('image/')) {
					const reader = new FileReader();
					reader.onload = (f) => {
						const result = f.target?.result as string;
						if (result) editor.addImage(result);
					};
					reader.readAsDataURL(file);
				}
			}
		},
		[editor],
	);

	return (
		<div className="h-screen flex flex-col bg-muted">
			<Navbar
			editor={editor}
			activeTool={activeTool}
			onChangeActiveTool={onChangeActiveTool}
			isSaved={isSaved}
		/>
			<div className="absolute h-[calc(100vh-68px)] w-full top-[68px] flex overflow-hidden">
				<Sidebar
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<TextSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<ShapeSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<DrawSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<FillColorSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<StrokeColorSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<StrokeWidthSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<OpacitySidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<FontSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<ImageSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<FilterSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<FlipRotateSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<CornerRadiusSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<CropSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<RemoveBgSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<StickersSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>

				<UploadSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<SettingsSidebar
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				<AiSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				
				{/* ── Canvas area ──────────────────────────────────────────── */}
				<main className="flex flex-1 flex-col min-h-0 overflow-hidden relative">
					<Toolbar
						editor={editor}
						activeTool={activeTool}
						onChangeActiveTool={onChangeActiveTool}
						key={JSON.stringify(editor?.canvas.getActiveObject())}
					/>
					<div
						ref={containerRef}
						className="flex-1 overflow-hidden bg-muted"
						style={{ minHeight: 0 }}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
					>
						<ContextMenuCanvas editor={editor}>
							<canvas
								ref={canvasRef}
								className="block w-full h-full"
							/>
						</ContextMenuCanvas>
					</div>
					{/* Layers panel — absolute overlay on the right, like image-sidebar */}
					<LayersSidebar
						editor={editor}
						activeTool={activeTool}
						onChangeActiveTool={onChangeActiveTool}
					/>
					<Footer />
					<KeyboardShortcutsDialog />
				</main>
			</div>
		</div>
	);
};
