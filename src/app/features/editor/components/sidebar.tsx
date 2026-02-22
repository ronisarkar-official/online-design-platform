'use client';

import {
	LayoutTemplate,
	ImageIcon,
	
	Settings,
	Shapes,
	Sparkle,
	Type,
	Smile,
	
	
	Layers,
	Upload,
	Pen,
} from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import { ActiveTool } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Sidebar = ({ activeTool, onChangeActiveTool }: SidebarProps) => {
	return (
		<aside className="bg-background flex flex-col w-[60px] h-full border-r shrink-0">
			<ScrollArea className="h-full w-full">
				<ul className="flex flex-col ">
					<SidebarItem
						icon={LayoutTemplate}
						label="Design"
						isActive={activeTool === 'templates'}
						onClick={() => onChangeActiveTool('templates')}
					/>
					<SidebarItem
						icon={ImageIcon}
						label="Image"
						isActive={activeTool === 'image'}
						onClick={() => onChangeActiveTool('image')}
					/>
					<SidebarItem
						icon={Type}
						label="Text"
						isActive={activeTool === 'text'}
						onClick={() => onChangeActiveTool('text')}
					/>
					<SidebarItem
						icon={Shapes}
						label="Shapes"
						isActive={activeTool === 'shapes'}
						onClick={() => onChangeActiveTool('shapes')}
					/>
					<SidebarItem
						icon={Pen}
						label="Draw"
						isActive={activeTool === 'draw'}
						onClick={() => onChangeActiveTool('draw')}
					/>
					<SidebarItem
						icon={Upload}
						label="Upload"
						isActive={activeTool === 'upload'}
						onClick={() => onChangeActiveTool('upload')}
					/>
					<SidebarItem
						icon={Layers}
						label="Layers"
						isActive={activeTool === 'layers'}
						onClick={() => onChangeActiveTool('layers')}
					/>
					<SidebarItem
						icon={Sparkle}
						label="Ai"
						isActive={activeTool === 'ai'}
						onClick={() => onChangeActiveTool('ai')}
					/>
					<SidebarItem
						icon={Settings}
						label="Settings"
						isActive={activeTool === 'settings'}
						onClick={() => onChangeActiveTool('settings')}
					/>
				</ul>
			</ScrollArea>
		</aside>
	);
};
