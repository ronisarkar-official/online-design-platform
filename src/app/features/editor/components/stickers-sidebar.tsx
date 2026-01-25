import React from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface StickersSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const StickersSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: StickersSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');

	const stickers = [
		// Emojis
		'😀', '😎', '🎉', '❤️', '⭐', '🔥', '👍', '👎', '👀', '🚀',
		'💡', '🎨', '📸', '🎵', '🍕', '🍔', '🍦', '🐶', '🐱', '🦄',
		// More shapes/symbols
		'⚠️', '✅', '❌', '❓', '❗', '💯', '💢', '💥', '💦', '💨',
	];

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'stickers' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Stickers"
				description="Add stickers and emojis to your design"
			/>
			<ScrollArea className="flex-1">
				<div className="grid grid-cols-5 gap-4 p-4">
					{stickers.map((sticker, index) => (
						<Button
							key={index}
							variant="outline"
							className="h-12 w-12 text-2xl p-0 flex items-center justify-center hover:bg-muted"
							onClick={() => {
								// For now, we add emojis as text objects, but in a real app these could be image URLs
								// Since we implemented addSticker for URLs, let's use a placeholder approach or 
								// if we want to support emojis properly, we should use addText.
								// Let's use addText for emojis for now as it's simpler without external assets.
								editor?.addText(sticker, { fontSize: 80 });
							}}
						>
							{sticker}
						</Button>
					))}
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
