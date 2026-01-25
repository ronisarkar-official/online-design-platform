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
} from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import { ActiveTool } from '../types';

interface SidebarProps {
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Sidebar = ({ activeTool, onChangeActiveTool }: SidebarProps) => {
	return (
		<aside className="bg-background flex flex-col w-[60px] h-full border-r overflow-y-auto ">
			<ul className="flex flex-col gap-y-2 mt-4">
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
					icon={Upload}
					label="Upload"
					isActive={activeTool === 'upload'}
					onClick={() => onChangeActiveTool('upload')}
				/>
				<SidebarItem
					icon={Settings}
					label="Settings"
					isActive={activeTool === 'settings'}
					onClick={() => onChangeActiveTool('settings')}
				/>
			</ul>
		</aside>
	);
};
