import React, { useCallback, useMemo } from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShapeTool } from './shape-tool';
import {
	FaCircle,
	FaSquare,
	FaSquareFull,
} from 'react-icons/fa';
import { IoTriangle } from 'react-icons/io5';
import { FaDiamond } from 'react-icons/fa6';
import { FaStar, FaHeart, FaArrowUp } from 'react-icons/fa';
import { TbPentagon, TbHexagon } from 'react-icons/tb';

const shapes = [
	{ method: 'addCircle', icon: FaCircle },
	{ method: 'addRectangle', icon: FaSquare },
	{ method: 'addSoftRectangle', icon: FaSquareFull },
	{ method: 'addTriangle', icon: IoTriangle },
	{ method: 'addDiamond', icon: FaDiamond },
	{ method: 'addStar', icon: FaStar },
	{ method: 'addHeart', icon: FaHeart },
	{ method: 'addArrow', icon: FaArrowUp },
	{ method: 'addPentagon', icon: TbPentagon },
	{ method: 'addHexagon', icon: TbHexagon },
];

interface ShapeSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ShapeSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: ShapeSidebarProps) => {
	const onClose = useCallback(() => onChangeActiveTool('select'), [onChangeActiveTool]);

	const shapesWithHandlers = useMemo(
		() =>
			shapes.map(({ method, icon }) => ({
				method,
				icon,
				onClick: () => (editor?.[method as keyof Editor] as () => void)(),
			})),
		[editor]
	);

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'shapes' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Shapes"
				description="Add Shapes to your design"
			/>
			<ScrollArea className="flex-1">
				<div className="grid grid-cols-3 gap-4 p-4">
					{shapesWithHandlers.map(({ method, icon, onClick }) => (
						<ShapeTool
							key={method}
							onClick={onClick}
							icon={icon}
						/>
					))}
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
