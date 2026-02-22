'use client';
import React, {
	useEffect,
	useState,
	useCallback,
	useRef,
} from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import {
	Eye,
	EyeOff,
	Lock,
	Unlock,
	Trash2,
	Type,
	ImageIcon,
	Square,
	Circle,
	Triangle,
	Layers,
	GripVertical,
	Pentagon,
} from 'lucide-react';
import * as fabric from 'fabric';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';

interface LayersSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

function LayerTypeIcon({ type }: { type: string }) {
	const cls = 'h-3.5 w-3.5 shrink-0';
	switch (type) {
		case 'i-text':
		case 'textbox':
		case 'text':
			return <Type className={cn(cls, 'text-blue-500')} />;
		case 'image':
			return <ImageIcon className={cn(cls, 'text-emerald-500')} />;
		case 'rect':
			return <Square className={cn(cls, 'text-violet-500')} />;
		case 'circle':
			return <Circle className={cn(cls, 'text-pink-500')} />;
		case 'triangle':
			return <Triangle className={cn(cls, 'text-amber-500')} />;
		case 'group':
			return <Layers className={cn(cls, 'text-orange-500')} />;
		default:
			return <Pentagon className={cn(cls, 'text-muted-foreground')} />;
	}
}

function getLayerLabel(object: fabric.Object, index: number): string {
	const obj = object as unknown as Record<string, unknown>;
	if (obj.customName) return obj.customName as string;
	switch (object.type) {
		case 'i-text':
		case 'textbox':
		case 'text': {
			const text = obj.text as string | undefined;
			return text ? text.replace(/\n/g, ' ').substring(0, 20) || 'Text' : 'Text';
		}
		case 'image': return 'Image';
		case 'rect': return 'Rectangle';
		case 'circle': return 'Ellipse';
		case 'triangle': return 'Triangle';
		case 'group': return 'Group';
		default: return `Layer ${index + 1}`;
	}
}

function LayerThumbnail({ object }: { object: fabric.Object }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		try {
			const size = 30;
			const src = object.toCanvasElement();
			const ctx = el.getContext('2d');
			if (!ctx || !src) return;
			const w = src.width || 1;
			const h = src.height || 1;
			const ratio = Math.min(size / w, size / h);
			ctx.clearRect(0, 0, size, size);
			const sq = 4;
			for (let x = 0; x < size; x += sq) {
				for (let y = 0; y < size; y += sq) {
					ctx.fillStyle = (Math.floor(x / sq) + Math.floor(y / sq)) % 2 === 0
						? 'rgba(128,128,128,0.15)' : 'rgba(128,128,128,0.05)';
					ctx.fillRect(x, y, sq, sq);
				}
			}
			const dw = w * ratio, dh = h * ratio;
			ctx.drawImage(src, (size - dw) / 2, (size - dh) / 2, dw, dh);
		} catch { /* silent */ }
	}, [object]);
	return <canvas ref={canvasRef} width={30} height={30} className="rounded-sm shrink-0 border border-border" />;
}

interface LayerRowProps {
	object: fabric.Object;
	index: number;
	isActive: boolean;
	onSelect: () => void;
	onToggleVisibility: () => void;
	onToggleLock: () => void;
	onDelete: () => void;
	onRename: (name: string) => void;
}

function LayerRow({ object, index, isActive, onSelect, onToggleVisibility, onToggleLock, onDelete, onRename }: LayerRowProps) {
	const [editing, setEditing] = useState(false);
	const [nameValue, setNameValue] = useState('');
	const dragControls = useDragControls();
	const inputRef = useRef<HTMLInputElement>(null);
	const isLocked = !!(object as unknown as Record<string, unknown>).lockMovementX;

	const startEditing = () => {
		setNameValue(getLayerLabel(object, index));
		setEditing(true);
		setTimeout(() => inputRef.current?.select(), 10);
	};
	const commitEdit = () => {
		setEditing(false);
		if (nameValue.trim()) onRename(nameValue.trim());
	};

	return (
		<Reorder.Item
			value={object}
			dragListener={false}
			dragControls={dragControls}
			className="relative select-none"
			initial={{ opacity: 0, y: -3 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -3 }}
			transition={{ duration: 0.12 }}
		>
			<div
				onClick={onSelect}
				className={cn(
					'group flex items-center cursor-pointer transition-all duration-150',
					'border-b border-border',
					isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-accent'
				)}
			>
				<button
					className="flex items-center justify-center w-7 shrink-0 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
					onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
					title={object.visible ? 'Hide layer' : 'Show layer'}
				>
					{object.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-30" />}
				</button>

				<div className="w-8 shrink-0 flex items-center justify-center py-1.5">
					<LayerThumbnail object={object} />
				</div>

				<div className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
					<LayerTypeIcon type={object.type ?? ''} />
					{editing ? (
						<input
							ref={inputRef}
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							onBlur={commitEdit}
							onKeyDown={(e) => {
								if (e.key === 'Enter') commitEdit();
								if (e.key === 'Escape') setEditing(false);
							}}
							onClick={(e) => e.stopPropagation()}
							className="flex-1 min-w-0 bg-background text-foreground text-xs px-1 py-0.5 rounded outline-none ring-1 ring-primary"
						/>
					) : (
						<span
							className={cn('flex-1 min-w-0 text-xs truncate font-medium', object.visible ? 'text-foreground' : 'text-muted-foreground line-through')}
							onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
							title="Double-click to rename"
						>
							{getLayerLabel(object, index)}
						</span>
					)}
				</div>

				<span className="text-[10px] text-muted-foreground w-7 text-right shrink-0 pr-1 tabular-nums">
					{Math.round((object.opacity ?? 1) * 100)}%
				</span>

				<button
					className={cn(
						'flex items-center justify-center w-6 shrink-0 py-2 transition-all duration-100',
						isLocked ? 'text-amber-500 opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500'
					)}
					onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
					title={isLocked ? 'Unlock layer' : 'Lock layer'}
				>
					{isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
				</button>

				<button
					className="flex items-center justify-center w-6 shrink-0 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-100"
					onClick={(e) => { e.stopPropagation(); onDelete(); }}
					title="Delete layer"
				>
					<Trash2 className="h-3 w-3" />
				</button>

				<button
					className="flex items-center justify-center w-6 shrink-0 py-2 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
					onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
					title="Drag to reorder"
				>
					<GripVertical className="h-3.5 w-3.5" />
				</button>
			</div>
		</Reorder.Item>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────
// This follows the EXACT same pattern as image-sidebar.tsx:
//   - Absolute positioned overlay
//   - Toggled by activeTool === 'layers' (block/hidden)
//   - ToolSidebarHeader + ToolSidebarClose for header and close button
//   - Does NOT participate in flex layout — zero impact on sibling elements
export const LayersSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: LayersSidebarProps) => {
	const [objects, setObjects] = useState<fabric.Object[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);

	const onClose = () => onChangeActiveTool('select');

	const refreshObjects = useCallback(() => {
		if (!editor?.canvas) return;
		const objs = editor.canvas.getObjects().filter((o) => {
			const obj = o as unknown as Record<string, unknown>;
			return obj.name !== 'clip' && obj.name !== 'background' && o !== editor.getWorkspace();
		});
		objs.forEach((obj) => {
			const o = obj as unknown as Record<string, unknown>;
			if (!o.id) o.id = crypto.randomUUID();
		});
		setObjects([...objs].reverse());
	}, [editor]);

	const syncActive = useCallback(() => {
		if (!editor?.canvas) return;
		const active = editor.canvas.getActiveObject() as unknown as Record<string, unknown>;
		setActiveId((active?.id as string) ?? null);
	}, [editor]);

	useEffect(() => {
		if (!editor?.canvas) return;
		const handleUpdate = () => refreshObjects();
		const handleSelect = () => syncActive();
		const handleClear = () => setActiveId(null);
		const t = setTimeout(() => { refreshObjects(); syncActive(); }, 0);
		editor.canvas.on('object:added', handleUpdate);
		editor.canvas.on('object:removed', handleUpdate);
		editor.canvas.on('object:modified', handleUpdate);
		editor.canvas.on('selection:created', handleSelect);
		editor.canvas.on('selection:updated', handleSelect);
		editor.canvas.on('selection:cleared', handleClear);
		return () => {
			clearTimeout(t);
			editor.canvas.off('object:added', handleUpdate);
			editor.canvas.off('object:removed', handleUpdate);
			editor.canvas.off('object:modified', handleUpdate);
			editor.canvas.off('selection:created', handleSelect);
			editor.canvas.off('selection:updated', handleSelect);
			editor.canvas.off('selection:cleared', handleClear);
		};
	}, [editor, refreshObjects, syncActive]);

	const handleReorder = (newOrder: fabric.Object[]) => {
		setObjects(newOrder);
		if (!editor?.canvas) return;
		[...newOrder].reverse().forEach((obj) => editor.canvas.bringObjectToFront(obj));
		editor.canvas.renderAll();
	};

	const selectObject = (object: fabric.Object) => {
		editor?.canvas.setActiveObject(object);
		editor?.canvas.renderAll();
		setActiveId(((object as unknown as Record<string, unknown>).id as string) ?? null);
	};

	const toggleVisibility = (object: fabric.Object) => {
		object.set('visible', !object.visible);
		editor?.canvas.renderAll();
		refreshObjects();
	};

	const toggleLock = (object: fabric.Object) => {
		const locked = !!(object as unknown as Record<string, unknown>).lockMovementX;
		object.set({ lockMovementX: !locked, lockMovementY: !locked, lockRotation: !locked, lockScalingX: !locked, lockScalingY: !locked } as Partial<fabric.Object>);
		editor?.canvas.renderAll();
		refreshObjects();
	};

	const deleteObject = (object: fabric.Object) => {
		editor?.canvas.remove(object);
		editor?.canvas.renderAll();
		refreshObjects();
	};

	const renameObject = (object: fabric.Object, name: string) => {
		(object as unknown as Record<string, unknown>).customName = name;
		refreshObjects();
	};

	// Same pattern as image-sidebar.tsx:
	// - absolute positioned on the RIGHT side (right-0)
	// - block/hidden toggled by activeTool
	// - sits ON TOP of the canvas, doesn't affect flex layout at all
	return (
		<aside
			className={cn(
				'w-[220px] absolute right-0 top-0 z-40',
				activeTool === 'layers' ? 'block' : 'hidden',
			)}
			style={{ height: 'calc(100% - 48px)' }}
			aria-hidden={activeTool !== 'layers'}
		>
			<div className="w-full h-full bg-background border-l flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="Layers"
					description="Manage canvas layers"
				/>

				{/* Column labels */}
				<div className="flex items-center border-b border-border shrink-0 bg-muted/50">
					<div className="w-7 text-center text-[9px] text-muted-foreground py-1 uppercase tracking-wide">VIS</div>
					<div className="w-8" />
					<div className="flex-1 text-[9px] text-muted-foreground py-1 px-2 uppercase tracking-wide">Name</div>
					<div className="w-7 text-right text-[9px] text-muted-foreground pr-1 uppercase tracking-wide">OP%</div>
					<div className="w-6" /><div className="w-6" /><div className="w-6" />
				</div>

				{/* Layer list */}
				<div className="flex-1 overflow-y-auto overflow-x-hidden">
					<AnimatePresence initial={false}>
						{objects.length === 0 ? (
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-3">
								<Layers className="h-8 w-8 text-muted-foreground/30" />
								<p className="text-[11px] text-muted-foreground text-center px-4 leading-relaxed">
									Add objects to the<br />canvas to see layers
								</p>
							</motion.div>
						) : (
							<Reorder.Group axis="y" values={objects} onReorder={handleReorder} className="flex flex-col" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
								<AnimatePresence>
									{objects.map((object, index) => {
										const id = (object as unknown as Record<string, unknown>).id as string;
										return (
											<LayerRow
												key={id}
												object={object}
												index={index}
												isActive={id === activeId}
												onSelect={() => selectObject(object)}
												onToggleVisibility={() => toggleVisibility(object)}
												onToggleLock={() => toggleLock(object)}
												onDelete={() => deleteObject(object)}
												onRename={(name) => renameObject(object, name)}
											/>
										);
									})}
								</AnimatePresence>
							</Reorder.Group>
						)}
					</AnimatePresence>
				</div>

				{/* Footer */}
				<div className="flex items-center gap-1 px-2 py-2 border-t border-border bg-muted/40 shrink-0">
					<button
						className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all duration-150 font-medium"
						onClick={refreshObjects}
						title="Refresh layers"
					>
						<Layers className="h-3 w-3" />
						Refresh
					</button>
					<div className="w-px h-4 bg-border" />
					<button
						className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all duration-150 font-medium"
						onClick={() => {
							const active = editor?.canvas.getActiveObject();
							if (active) { editor?.canvas.remove(active); editor?.canvas.renderAll(); refreshObjects(); }
						}}
						title="Delete selected layer"
					>
						<Trash2 className="h-3 w-3" />
						Delete
					</button>
				</div>
			</div>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
