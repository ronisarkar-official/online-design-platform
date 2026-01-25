import React, { useState } from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './color-picker';

interface TextEffectsSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TextEffectsSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: TextEffectsSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');
	
	const [shadowColor, setShadowColor] = useState('rgba(0,0,0,0.5)');
	const [blur, setBlur] = useState(5);
	const [offsetX, setOffsetX] = useState(5);
	const [offsetY, setOffsetY] = useState(5);

	const applyShadow = () => {
		editor?.applyTextShadow({
			color: shadowColor,
			blur,
			offsetX,
			offsetY,
		});
	};

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'text-effects' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Text Effects"
				description="Apply shadows and effects to text"
			/>
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Drop Shadow</h3>
						
						<div className="space-y-2">
							<Label>Shadow Color</Label>
							<ColorPicker
								value={shadowColor}
								onChange={(value) => {
									setShadowColor(value);
									applyShadow();
								}}
							/>
						</div>

						<div className="space-y-2">
							<Label>Blur Radius ({blur}px)</Label>
							<Slider
								value={[blur]}
								onValueChange={(values) => {
									setBlur(values[0]);
									applyShadow();
								}}
								max={50}
								step={1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Offset X ({offsetX}px)</Label>
							<Slider
								value={[offsetX]}
								onValueChange={(values) => {
									setOffsetX(values[0]);
									applyShadow();
								}}
								min={-50}
								max={50}
								step={1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Offset Y ({offsetY}px)</Label>
							<Slider
								value={[offsetY]}
								onValueChange={(values) => {
									setOffsetY(values[0]);
									applyShadow();
								}}
								min={-50}
								max={50}
								step={1}
							/>
						</div>
						
						<Button onClick={applyShadow} className="w-full">
							Apply Shadow
						</Button>
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
