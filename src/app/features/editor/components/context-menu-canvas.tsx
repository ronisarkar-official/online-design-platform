import React, { forwardRef } from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Editor } from '../types';
import * as fabric from 'fabric';
import {
	ArrowUp,
	ArrowDown,
	Layers,
	ArrowDownToLine,
	ArrowUpToLine,
	Copy,
	ClipboardPaste,
	Trash2,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignVerticalJustifyStart,
	AlignVerticalJustifyCenter,
	AlignVerticalJustifyEnd,
	Move,
	Lock,
	Unlock,
} from 'lucide-react';

interface ContextMenuCanvasProps {
	editor: Editor | undefined;
	children: React.ReactNode;
}

// Alignment helpers — workspace-relative, same logic as toolbar
function alignToWorkspace(
	editor: Editor,
	align: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom',
) {
	const ws = editor.getWorkspace() as fabric.Rect | undefined;
	if (!ws) return;
	const wsL = ws.left ?? 0;
	const wsT = ws.top ?? 0;
	const wsW = ws.width ?? 0;
	const wsH = ws.height ?? 0;
	const objects = editor.canvas.getActiveObjects();
	if (!objects.length) return;

	objects.forEach((obj) => {
		const b = obj.getBoundingRect();
		switch (align) {
			case 'left':
				obj.set({ left: wsL + ((obj.left ?? 0) - b.left) });
				break;
			case 'centerH':
				obj.set({ left: wsL + wsW / 2 + ((obj.left ?? 0) - (b.left + b.width / 2)) });
				break;
			case 'right':
				obj.set({ left: wsL + wsW + ((obj.left ?? 0) - (b.left + b.width)) });
				break;
			case 'top':
				obj.set({ top: wsT + ((obj.top ?? 0) - b.top) });
				break;
			case 'centerV':
				obj.set({ top: wsT + wsH / 2 + ((obj.top ?? 0) - (b.top + b.height / 2)) });
				break;
			case 'bottom':
				obj.set({ top: wsT + wsH + ((obj.top ?? 0) - (b.top + b.height)) });
				break;
		}
		obj.setCoords();
	});
	editor.canvas.renderAll();
	editor.save();
}

export const ContextMenuCanvas = forwardRef<
	HTMLDivElement,
	ContextMenuCanvasProps
>(({ editor, children }, ref) => {
	const hasSelection = !!editor?.selectedObjects?.length;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					ref={ref}
					className="w-full h-full">
					{children}
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-48">
				<ContextMenuItem
					onClick={() => editor?.onCopy()}
					disabled={!hasSelection}>
					<Copy className="mr-2" /> Copy
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => editor?.onPaste()}
					disabled={!editor?.hasCopied}>
					<ClipboardPaste className="mr-2" /> Paste
				</ContextMenuItem>
				<ContextMenuSeparator />

				{/* ── Layer ordering ── */}
				<ContextMenuSub>
					<ContextMenuSubTrigger inset disabled={!hasSelection}>
					<Layers className="mr-2" />	Layer
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-44">
					<ContextMenuItem onClick={() => editor?.bringToFront()} disabled={!hasSelection}>
							<ArrowUpToLine className="mr-2" /> Bring To Front
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor?.bringForward()} disabled={!hasSelection}>
							<ArrowUp className="mr-2" /> Bring Forward
						</ContextMenuItem>
						
						<ContextMenuItem onClick={() => editor?.sendBackwards()} disabled={!hasSelection}>
							<ArrowDown className="mr-2" /> Send Backwards
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor?.sendToBack()} disabled={!hasSelection}>
							<ArrowDownToLine className="mr-2" /> Send To Back
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* ── Align to page ── */}
				<ContextMenuSub>
					<ContextMenuSubTrigger inset disabled={!hasSelection}>
						<Move className="mr-2" /> Align to Page
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'left')}>
							<AlignLeft className="mr-2 h-4 w-4" /> Align Left
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'centerH')}>
							<AlignCenter className="mr-2 h-4 w-4" /> Align Center
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'right')}>
							<AlignRight className="mr-2 h-4 w-4" /> Align Right
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'top')}>
							<AlignVerticalJustifyStart className="mr-2 h-4 w-4" /> Align Top
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'centerV')}>
							<AlignVerticalJustifyCenter className="mr-2 h-4 w-4" /> Align Middle
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor && alignToWorkspace(editor, 'bottom')}>
							<AlignVerticalJustifyEnd className="mr-2 h-4 w-4" /> Align Bottom
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />
				<ContextMenuItem
					onClick={() => {
						if (!editor) return;
						const objects = editor.canvas.getActiveObjects();
						objects.forEach((obj) => {
							const isLocked = !!(obj as unknown as Record<string, unknown>).lockMovementX;
							obj.set({
								lockMovementX: !isLocked,
								lockMovementY: !isLocked,
								lockRotation: !isLocked,
								lockScalingX: !isLocked,
								lockScalingY: !isLocked,
							} as Partial<fabric.Object>);
						});
						editor.canvas.renderAll();
					}}
					disabled={!hasSelection}>
					{(() => {
						const first = editor?.selectedObjects?.[0];
						const locked = first && !!(first as unknown as Record<string, unknown>).lockMovementX;
						return locked
							? <><Unlock className="mr-2 h-4 w-4" /> Unlock</>
							: <><Lock className="mr-2 h-4 w-4" /> Lock</>;
					})()}
				</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					onClick={() => editor?.delete()}
					disabled={!hasSelection}>
					<Trash2 className="mr-2" /> Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});

ContextMenuCanvas.displayName = 'ContextMenuCanvas';
