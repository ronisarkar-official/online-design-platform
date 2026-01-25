import React, { useEffect, useState, useCallback } from 'react';
import { ActiveTool, Editor } from '@/app/features/editor/types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
	Eye,
	EyeOff,
	Lock,
	Unlock,
	Trash2,
} from 'lucide-react';
import * as fabric from 'fabric';
import { Reorder } from 'framer-motion';

interface LayersSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const LayersSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: LayersSidebarProps) => {
	const onClose = () => onChangeActiveTool('select');
	const [objects, setObjects] = useState<fabric.Object[]>([]);
	const [isDragging, setIsDragging] = useState(false);

	// Helper to refresh objects list
	const refreshObjects = useCallback(() => {
		if (editor?.canvas) {
			const objs = editor.canvas.getObjects().filter((o: any) => {
				return o.name !== 'clip' && o.name !== 'background';
			});
			
			// Assign IDs if missing
			objs.forEach((obj: any) => {
				if (!obj.id) {
					obj.id = crypto.randomUUID();
				}
			});

			setObjects([...objs].reverse()); // Reverse to show top layer first
		}
	}, [editor?.canvas]);

	useEffect(() => {
		if (activeTool === 'layers' && editor?.canvas) {
			// Use setTimeout to avoid synchronous setState warning
			const timer = setTimeout(() => {
				refreshObjects();
			}, 0);
			
			// Listen for canvas events to update layers
			const handleUpdate = () => {
				// Only refresh if we are not currently dragging to avoid jitter
				if (!isDragging) {
					refreshObjects();
				}
			};
			
			editor.canvas.on('object:added', handleUpdate);
			editor.canvas.on('object:removed', handleUpdate);
			editor.canvas.on('object:modified', handleUpdate);
			
			return () => {
				clearTimeout(timer);
				editor.canvas.off('object:added', handleUpdate);
				editor.canvas.off('object:removed', handleUpdate);
				editor.canvas.off('object:modified', handleUpdate);
			};
		}
	}, [activeTool, editor?.canvas, isDragging, refreshObjects]);

	// We need ensure objects have stable IDs for Framer Motion Reorder
	// Fabric objects usually don't have IDs by default unless set. 
	// We can try to use a property or assign one if missing, but modifying external objects inside render/refresh is tricky.
	// Best to ensure they have IDs on refresh.
	
	const handleReorder = (newOrder: fabric.Object[]) => {
		setObjects(newOrder);
		
		if (editor?.canvas) {
			// newOrder is Top -> Bottom
			// We need to re-stack on canvas.
			// Canvas stack is Bottom -> Top.
			// So iterating newOrder reversed (Bottom -> Top) and bringToFront works.
			
			[...newOrder].reverse().forEach((obj) => {
				editor.canvas.bringObjectToFront(obj);
			});
			
			editor.canvas.renderAll();
		}
	};

	const toggleVisibility = (object: fabric.Object) => {
		object.set('visible', !object.visible);
		editor?.canvas.renderAll();
		refreshObjects();
	};

	const toggleLock = (object: fabric.Object) => {
		object.set('lockMovementX', !object.lockMovementX);
		object.set('lockMovementY', !object.lockMovementY);
		object.set('lockRotation', !object.lockRotation);
		object.set('lockScalingX', !object.lockScalingX);
		object.set('lockScalingY', !object.lockScalingY);
		editor?.canvas.renderAll();
		refreshObjects();
	};

	const selectObject = (object: fabric.Object) => {
		editor?.canvas.setActiveObject(object);
		editor?.canvas.renderAll();
	};

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				activeTool === 'layers' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'layers'}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="Layers"
					description="Manage objects and layers"
				/>
				
				<div className="p-4 border-b space-y-3">
					{/* Placeholder for future controls or search */}
					<div className="text-xs text-muted-foreground text-center">
						{objects.length} layer{objects.length !== 1 ? 's' : ''}
					</div>
				</div>

				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-4 space-y-2">
							<Reorder.Group 
								axis="y" 
								values={objects} 
								onReorder={handleReorder}
								className="space-y-2"
							>
								{objects.map((object) => {
									const id = (object as any).id;
		
									return (
										<Reorder.Item
											key={id}
											value={object}
											onDragStart={() => setIsDragging(true)}
											onDragEnd={() => setIsDragging(false)}
											className="relative"
										>
											<div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted bg-background cursor-grab active:cursor-grabbing">
												<div
													className="flex items-center gap-2 flex-1 cursor-pointer truncate"
													onClick={() => selectObject(object)}>
													<span className="text-sm font-medium truncate max-w-[120px]">
														{object.type} {(object as any).text ? `- ${(object as any).text.substring(0, 10)}...` : ''}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={(e) => {
															e.stopPropagation();
															toggleVisibility(object);
														}}>
														{object.visible ?
															<Eye className="h-4 w-4" />
														:	<EyeOff className="h-4 w-4" />}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={(e) => {
															e.stopPropagation();
															toggleLock(object);
														}}>
														{object.lockMovementX ?
															<Lock className="h-4 w-4" />
														:	<Unlock className="h-4 w-4" />}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-500 hover:text-red-600"
														onClick={(e) => {
															e.stopPropagation();
															editor?.canvas.remove(object);
															refreshObjects();
														}}>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</Reorder.Item>
									);
								})}
							</Reorder.Group>
							{objects.length === 0 && (
								<div className="text-center text-gray-500 py-8">
									No layers found
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</div>
			
			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
