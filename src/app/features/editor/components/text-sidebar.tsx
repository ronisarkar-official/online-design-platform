import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface TextSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TextSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: TextSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'text' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Text"
				description="Add Text to your design"
			/>
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					<Button
						className="w-full"
						variant="outline"
						onClick={() => editor?.addText('TextBox', {})}>
						Add A TextBox
					</Button>
					<Button
						className="w-full h-16"
						variant="secondary"
						size="lg"
						onClick={() =>
							editor?.addText('Heading', {
								fontSize: 80,
								fontWeight: 700,
							})
						}>
						<span className="text-3xl font-bold ">Add A Heading</span>
					</Button>
					<Button
						className="w-full h-16"
						variant="secondary"
						size="lg"
						onClick={() =>
							editor?.addText('Subheading', {
								fontSize: 44,
								fontWeight: 500,
							})
						}>
						<span className="text-xl font-semibold ">Add A Subheading</span>
					</Button>
					<Button
						className="w-full h-16"
						variant="secondary"
						size="lg"
						onClick={() =>
							editor?.addText('Paragraph', {
								fontSize: 32,
							})
						}>
						Add A Paragraph
					</Button>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
