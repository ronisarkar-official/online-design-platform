import React from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface EffectsSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const EffectsSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: EffectsSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');

	const applyFilter = (filter: string) => {
		editor?.changeImageFilter(filter);
	};

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'effects' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Effects"
				description="Apply filters and effects to images"
			/>
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Filters</h3>
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline" onClick={() => applyFilter('none')}>None</Button>
							<Button variant="outline" onClick={() => applyFilter('polaroid')}>Polaroid</Button>
							<Button variant="outline" onClick={() => applyFilter('sepia')}>Sepia</Button>
							<Button variant="outline" onClick={() => applyFilter('kodachrome')}>Kodachrome</Button>
							<Button variant="outline" onClick={() => applyFilter('contrast')}>Contrast</Button>
							<Button variant="outline" onClick={() => applyFilter('brightness')}>Brightness</Button>
							<Button variant="outline" onClick={() => applyFilter('greyscale')}>Greyscale</Button>
							<Button variant="outline" onClick={() => applyFilter('vintage')}>Vintage</Button>
							<Button variant="outline" onClick={() => applyFilter('technicolor')}>Technicolor</Button>
							<Button variant="outline" onClick={() => applyFilter('pixelate')}>Pixelate</Button>
							<Button variant="outline" onClick={() => applyFilter('invert')}>Invert</Button>
							<Button variant="outline" onClick={() => applyFilter('blur')}>Blur</Button>
						</div>
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
