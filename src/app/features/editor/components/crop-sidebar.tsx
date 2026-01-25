import React, { useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Crop, Lock, Unlock } from 'lucide-react';

interface CropSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const CropSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: CropSidebarProps) => {
	const [left, setLeft] = useState('0');
	const [top, setTop] = useState('0');
	const [width, setWidth] = useState('400');
	const [height, setHeight] = useState('400');
	const [aspectRatioLocked, setAspectRatioLocked] = useState(false);

	const onClose = () => onChangeActiveTool('select');

	const commonAspectRatios = [
		{ label: '1:1', ratio: 1 },
		{ label: '4:3', ratio: 4 / 3 },
		{ label: '16:9', ratio: 16 / 9 },
		{ label: '3:2', ratio: 3 / 2 },
	];

	const handleApply = () => {
		const options = {
			left: parseFloat(left) || 0,
			top: parseFloat(top) || 0,
			width: parseFloat(width) || 400,
			height: parseFloat(height) || 400,
		};
		editor?.cropImage(options);
		onClose();
	};

	const handleAspectRatio = (ratio: number) => {
		const w = parseFloat(width) || 400;
		const newHeight = w / ratio;
		setHeight(newHeight.toString());
	};

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'crop' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'crop'}>
			<ToolSidebarHeader
				title="Crop Image"
				description="Set crop boundaries"
			/>

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					{/* Position */}
					<div className="space-y-3">
						<Label className="text-sm font-semibold">Position</Label>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Left</Label>
								<Input
									type="number"
									value={left}
									onChange={(e) => setLeft(e.target.value)}
									placeholder="0"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Top</Label>
								<Input
									type="number"
									value={top}
									onChange={(e) => setTop(e.target.value)}
									placeholder="0"
								/>
							</div>
						</div>
					</div>

					{/* Dimensions */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-sm font-semibold">Dimensions</Label>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
								className="h-8 w-8 p-0">
								{aspectRatioLocked ? (
									<Lock className="h-4 w-4" />
								) : (
									<Unlock className="h-4 w-4" />
								)}
							</Button>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Width</Label>
								<Input
									type="number"
									value={width}
									onChange={(e) => setWidth(e.target.value)}
									placeholder="400"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-muted-foreground">Height</Label>
								<Input
									type="number"
									value={height}
									onChange={(e) => setHeight(e.target.value)}
									placeholder="400"
								/>
							</div>
						</div>
					</div>

					{/* Aspect Ratio Presets */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Aspect Ratio</Label>
						<div className="grid grid-cols-2 gap-2">
							{commonAspectRatios.map((preset) => (
								<Button
									key={preset.label}
									variant="outline"
									size="sm"
									onClick={() => handleAspectRatio(preset.ratio)}>
									{preset.label}
								</Button>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2 pt-4">
						<Button
							onClick={handleApply}
							className="flex-1 flex items-center gap-2">
							<Crop className="h-4 w-4" />
							Apply Crop
						</Button>
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
					</div>
				</div>
			</ScrollArea>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
