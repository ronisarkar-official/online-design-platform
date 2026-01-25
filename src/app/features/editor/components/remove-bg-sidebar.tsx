import React, { useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Scissors, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RemoveBgSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const RemoveBgSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: RemoveBgSidebarProps) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const onClose = () => onChangeActiveTool('select');

	const handleRemoveBackground = async () => {
		if (!editor) return;
		
		setIsProcessing(true);
		setError(null);
		
		try {
			await editor.removeBackground();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to remove background');
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full bg-background absolute left-0 md:left-[60px] border-r z-40 flex flex-col',
				activeTool === 'remove-bg' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'remove-bg'}>
			<ToolSidebarHeader
				title="Remove Background"
				description="Remove background from your image"
			/>

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-4">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription className="text-xs">
							Background removal feature is currently in development. 
							This requires integration with an AI service or background removal API.
						</AlertDescription>
					</Alert>

					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Click the button below to remove the background from your selected image.
						</p>

						<Button
							onClick={handleRemoveBackground}
							disabled={isProcessing}
							className="w-full flex items-center gap-2"
							size="lg">
							{isProcessing ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								<>
									<Scissors className="h-4 w-4" />
									Remove Background
								</>
							)}
						</Button>

						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription className="text-xs">
									{error}
								</AlertDescription>
							</Alert>
						)}
					</div>

					<div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
						<p className="font-semibold">Future Integration Options:</p>
						<ul className="list-disc list-inside space-y-1 pl-2">
							<li>Remove.bg API</li>
							<li>Client-side ML library</li>
							<li>Custom background removal service</li>
						</ul>
					</div>
				</div>
			</ScrollArea>

			<ToolSidebarClose onClick={onClose} />
		</aside>
	);
};
