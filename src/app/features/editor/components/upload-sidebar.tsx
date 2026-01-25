
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import {  ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from './image-upload';

interface UploadSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const UploadSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: UploadSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'upload' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Upload"
				description="Upload images to your design"
			/>
			<ScrollArea className="flex-1">
				<div className="p-4">
					<ImageUpload onUpload={(url) => editor?.addImage(url)} />
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
