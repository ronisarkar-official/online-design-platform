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
import {
	ArrowUp,
	ArrowDown,
	Layers,
	ArrowDownToLine,
	ArrowUpToLine,
	Copy,
	ClipboardPaste,
	Trash2,
} from 'lucide-react';

interface ContextMenuCanvasProps {
	editor: Editor | undefined;
	children: React.ReactNode;
}

export const ContextMenuCanvas = forwardRef<
	HTMLDivElement,
	ContextMenuCanvasProps
>(({ editor, children }, ref) => {
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
					disabled={!editor?.selectedObjects?.length}>
					<Copy className="mr-2" /> Copy
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => editor?.onPaste()}>
					<ClipboardPaste className="mr-2" /> Paste
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger inset>
					<Layers className="mr-2" />	Layer
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-44">
					<ContextMenuItem onClick={() => editor?.bringToFront()}>
							<ArrowUpToLine className="mr-2" /> Bring To Front
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor?.bringForward()}>
							<ArrowUp className="mr-2" /> Bring Forward
						</ContextMenuItem>
						
						<ContextMenuItem onClick={() => editor?.sendBackwards()}>
							<ArrowDown className="mr-2" /> Send Backwards
						</ContextMenuItem>
						<ContextMenuItem onClick={() => editor?.sendToBack()}>
							<ArrowDownToLine className="mr-2" /> Send To Back
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
				<ContextMenuItem
					variant="destructive"
					onClick={() => editor?.delete()}
					disabled={!editor?.selectedObjects?.length}>
					<Trash2 className="mr-2" /> Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});

ContextMenuCanvas.displayName = 'ContextMenuCanvas';
