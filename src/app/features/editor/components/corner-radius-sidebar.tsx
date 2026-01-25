import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface CornerRadiusSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const CornerRadiusSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: CornerRadiusSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');
	
	const currentRadius = useMemo(
		() => editor?.getActiveCornerRadius() ?? 0,
		[editor],
	);

	const [radius, setRadius] = useState<number>(currentRadius);

	useEffect(() => {
		setRadius(currentRadius);
	}, [currentRadius]);

	const sliderValue = useMemo(() => [radius], [radius]);

	const onSliderValueChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			setRadius(v);
		},
		[],
	);

	const onSliderValueCommit = useCallback(
		(values: number[]) => {
			const v = values[0];
			editor?.changeCornerRadius(v);
		},
		[editor],
	);

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'corner-radius' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'corner-radius'}>
			<ToolSidebarHeader
				title="Corner Radius"
				description="Round the corners of your image"
			/>

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Radius</Label>
						<Slider
							value={sliderValue}
							onValueChange={onSliderValueChange}
							onValueCommit={onSliderValueCommit}
							min={0}
							max={200}
							step={1}
							className="w-full"
						/>
						<div className="text-xs text-muted-foreground text-center">
							{radius}px
						</div>
					</div>
				</div>
			</ScrollArea>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
