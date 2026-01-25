import React from 'react';
import { ActiveTool, Editor, filters } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const FilterSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: FilterSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col shadow-sm',
				activeTool === 'filter' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'filter'}>
			<ToolSidebarHeader
				title="Filters"
				description="Apply filters to your image"
			/>

			<div className="flex-1 min-h-10 overflow-hidden">
				<ScrollArea className="h-full">
					<div
						className={
							`overflow-y-auto max-h-[calc(100vh-160px)] p-4 space-y-2 ` +
							`[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted ` +
							`[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full`
						}>
						{filters.map((filter) => (
							<Button
								key={filter}
								variant="outline"
								size="lg"
								onClick={() => editor?.changeImageFilter(filter)}
								className="w-full justify-start text-left font-medium hover:bg-muted transition-colors capitalize">
								{filter.replace(/([A-Z])/g, ' $1').trim()}
							</Button>
						))}
					</div>
				</ScrollArea>
			</div>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
