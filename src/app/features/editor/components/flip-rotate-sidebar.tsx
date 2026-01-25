import React, { useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FlipHorizontal, FlipVertical, RotateCw, RotateCcw } from 'lucide-react';

interface FlipRotateSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const FlipRotateSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: FlipRotateSidebarProps) => {
	const [customAngle, setCustomAngle] = useState<string>('45');
	const onClose = () => onChangeActiveTool('select');

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'flip-rotate' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'flip-rotate'}>
			<ToolSidebarHeader
				title="Flip & Rotate"
				description="Transform your image"
			/>

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					{/* Flip Section */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Flip</Label>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								onClick={() => editor?.flipImageHorizontal()}
								className="flex items-center gap-2">
								<FlipHorizontal className="h-4 w-4" />
								Horizontal
							</Button>
							<Button
								variant="outline"
								onClick={() => editor?.flipImageVertical()}
								className="flex items-center gap-2">
								<FlipVertical className="h-4 w-4" />
								Vertical
							</Button>
						</div>
					</div>

					{/* Rotate Section */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Rotate</Label>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								onClick={() => editor?.rotateImage(90)}
								className="flex items-center gap-2">
								<RotateCw className="h-4 w-4" />
								90° CW
							</Button>
							<Button
								variant="outline"
								onClick={() => editor?.rotateImage(-90)}
								className="flex items-center gap-2">
								<RotateCcw className="h-4 w-4" />
								90° CCW
							</Button>
						</div>
					</div>

					{/* Custom Angle Section */}
					<div className="space-y-2">
						<Label className="text-sm font-semibold">Custom Angle</Label>
						<div className="flex gap-2">
							<Input
								type="number"
								value={customAngle}
								onChange={(e) => setCustomAngle(e.target.value)}
								placeholder="Angle in degrees"
								className="flex-1"
							/>
							<Button
								onClick={() => {
									const angle = parseFloat(customAngle);
									if (!isNaN(angle)) {
										editor?.rotateImage(angle);
									}
								}}
								variant="default">
								Apply
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Enter angle in degrees (e.g., 45, -30)
						</p>
					</div>
				</div>
			</ScrollArea>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
