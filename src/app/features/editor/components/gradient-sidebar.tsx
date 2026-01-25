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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GradientSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const GradientSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: GradientSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');
	
	const [color1, setColor1] = useState('#ff0000');
	const [color2, setColor2] = useState('#0000ff');
	const [angle, setAngle] = useState(90);
	const [type, setType] = useState<'linear' | 'radial'>('linear');

	const applyGradient = () => {
		editor?.applyGradient([color1, color2], angle, type);
	};

	return (
		<aside
			className={cn(
				'w-full md:w-[360px] h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'gradient' ? 'block' : 'hidden',
			)}>
			<ToolSidebarHeader
				title="Gradient Fill"
				description="Create gradient fills for shapes"
			/>
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					<Tabs defaultValue="linear" onValueChange={(v) => setType(v as 'linear' | 'radial')}>
						<TabsList className="w-full">
							<TabsTrigger value="linear" className="w-1/2">Linear</TabsTrigger>
							<TabsTrigger value="radial" className="w-1/2">Radial</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Start Color</Label>
							<ColorPicker
								value={color1}
								onChange={(value) => {
									setColor1(value);
									// Auto-apply for better UX
									// editor?.applyGradient([value, color2], angle, type);
								}}
							/>
						</div>

						<div className="space-y-2">
							<Label>End Color</Label>
							<ColorPicker
								value={color2}
								onChange={(value) => {
									setColor2(value);
									// Auto-apply for better UX
									// editor?.applyGradient([color1, value], angle, type);
								}}
							/>
						</div>

						{type === 'linear' && (
							<div className="space-y-2">
								<Label>Angle ({angle}°)</Label>
								<Slider
									value={[angle]}
									onValueChange={(values) => setAngle(values[0])}
									max={360}
									step={1}
								/>
							</div>
						)}
						
						<Button onClick={applyGradient} className="w-full">
							Apply Gradient
						</Button>
					</div>
				</div>
			</ScrollArea>
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
