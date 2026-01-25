'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveTool } from '@/app/features/editor/types';
import { useEditor } from '@/app/features/editor/hooks/use-editor';
import * as fabric from 'fabric';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Toolbar } from './toolbar';
import { ShapeSidebar } from './shape-sidebar';
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
import { GradientSidebar } from './gradient-sidebar';
import { LayersSidebar } from './layers-sidebar';
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

	// Load project data if projectId is provided
	useEffect(() => {
		if (projectId && editor) {
			const project = projectStorage.getById(projectId);
			if (project && project.canvasData) {
				editor.canvas.loadFromJSON(project.canvasData).then(() => {
					editor.canvas.renderAll();
					editor.autoZoom();
				});
			}
		}
	}, [projectId, editor]);

	// Auto-save functionality
	useEffect(() => {
		if (!projectId || !editor) return;

		const saveProject = async () => {
			const json = editor.canvas.toJSON();
			
			// Generate thumbnail using Fabric's native toDataURL
			const width = editor.canvas.width || 800;
			const multiplier = 400 / width;
			const thumbnail = editor.canvas.toDataURL({
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
		};

		let timeoutId: NodeJS.Timeout;
		const debouncedSave = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(saveProject, 1000);
		};

		// Listen to canvas events
		editor.canvas.on('object:modified', debouncedSave);
		editor.canvas.on('object:added', debouncedSave);
		editor.canvas.on('object:removed', debouncedSave);
		editor.canvas.on('path:created', debouncedSave); // For drawing mode

		return () => {
			clearTimeout(timeoutId);
			editor.canvas.off('object:modified', debouncedSave);
			editor.canvas.off('object:added', debouncedSave);
			editor.canvas.off('object:removed', debouncedSave);
			editor.canvas.off('path:created', debouncedSave);
		};
	}, [projectId, editor]);

	const onChangeActiveTool = useCallback(
		(tool: ActiveTool) => {
			if (tool === activeTool) return setActiveTool('select');
			if (tool === 'draw') {
			}
			if (activeTool === 'draw') {
			}
			setActiveTool(tool);
		},
		[activeTool],
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

	return (
		<div className="h-screen flex flex-col bg-muted">
			<Navbar
			editor={editor}
			activeTool={activeTool}
			onChangeActiveTool={onChangeActiveTool}
		/>
			<div className="absolute h-[calc(100vh-68px)] w-full top-[68px]  flex">
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
				
				<LayersSidebar
					editor={editor}
					activeTool={activeTool}
					onChangeActiveTool={onChangeActiveTool}
				/>
				
				
				<main className=" flex-1  relative flex flex-col ">
					<Toolbar
						editor={editor}
						activeTool={activeTool}
						onChangeActiveTool={onChangeActiveTool}
						key={JSON.stringify(editor?.canvas.getActiveObject())}
					/>
					<div
						ref={containerRef}
						className="flex-1 overflow-hidden bg-muted"
						style={{ minHeight: '400px' }}
					>
						<ContextMenuCanvas editor={editor}>
							<canvas
								ref={canvasRef}
								className="block w-full h-full"
							/>
						</ContextMenuCanvas>
					</div>
					<Footer />
					<KeyboardShortcutsDialog />
				</main>
			</div>
		</div>
	);
};
