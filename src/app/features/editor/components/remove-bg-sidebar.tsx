'use client';

import React, { useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
	Loader2,
	Scissors,
	AlertCircle,
	KeyRound,
	ArrowRight,
	CheckCircle2,
	ImageOff,
} from 'lucide-react';

// ─── localStorage helper (same key as settings-sidebar) ──────────────────────
function getBgRemoveKey(): string {
	if (typeof window === 'undefined') return '';
	try {
		const stored = JSON.parse(localStorage.getItem('editor_api_keys') || '{}');
		return stored['bg_remove'] || '';
	} catch {
		return '';
	}
}

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
	const [success, setSuccess] = useState(false);

	const onClose = () => onChangeActiveTool('select');

	// Read key fresh on every click so it picks up any key saved in Settings
	const handleRemoveBackground = async () => {
		if (!editor) return;

		const apiKey = getBgRemoveKey();
		if (!apiKey) {
			setError('No API key found. Add your Remove.bg API key in Settings first.');
			return;
		}

		setIsProcessing(true);
		setError(null);
		setSuccess(false);

		try {
			await editor.removeBackground(apiKey);
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to remove background. Check your API key.');
		} finally {
			setIsProcessing(false);
		}
	};

	// Read key lazily — re-read every render so Settings changes are reflected
	const hasKey = !!getBgRemoveKey();

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				activeTool === 'remove-bg' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'remove-bg'}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="Remove Background"
					description="AI-powered background removal via Remove.bg"
				/>

				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-4 space-y-4">

							{/* API key status banner */}
							{hasKey ? (
								<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-3 py-2.5">
									<CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
									<p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
										API key configured — ready to use
									</p>
								</div>
							) : (
								<div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 space-y-2.5">
									<div className="flex items-start gap-2">
										<KeyRound className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
												API Key Required
											</p>
											<p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
												Add your{' '}
												<a
													href="https://www.remove.bg/api"
													target="_blank"
													rel="noopener noreferrer"
													className="underline underline-offset-2 hover:text-amber-900">
													Remove.bg
												</a>{' '}
												API key in Settings to enable background removal.
											</p>
										</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
										onClick={() => onChangeActiveTool('settings')}>
										<KeyRound className="h-3.5 w-3.5" />
										Go to Settings
										<ArrowRight className="h-3.5 w-3.5 ml-auto" />
									</Button>
								</div>
							)}

							{/* Description */}
							<div className="space-y-1.5">
								<p className="text-sm font-medium">How it works</p>
								<ul className="text-xs text-muted-foreground space-y-1.5 pl-1">
									<li className="flex items-start gap-1.5">
										<span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
										Select an image on the canvas
									</li>
									<li className="flex items-start gap-1.5">
										<span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
										Click &quot;Remove Background&quot; — your image is sent directly to Remove.bg
									</li>
									<li className="flex items-start gap-1.5">
										<span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">3</span>
										The result replaces the original on the canvas
									</li>
								</ul>
							</div>

							<div className="h-px bg-border" />

							{/* Action button */}
							<Button
								onClick={handleRemoveBackground}
								disabled={isProcessing || !editor}
								className="w-full gap-2"
								size="lg"
								variant={success ? 'outline' : 'default'}>
								{isProcessing ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Processing…
									</>
								) : success ? (
									<>
										<CheckCircle2 className="h-4 w-4 text-emerald-500" />
										Background removed!
									</>
								) : (
									<>
										<Scissors className="h-4 w-4" />
										Remove Background
									</>
								)}
							</Button>

							{/* No selection hint */}
							{!editor && (
								<div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs text-muted-foreground">
									<ImageOff className="h-4 w-4 shrink-0" />
									Select an image on the canvas first.
								</div>
							)}

							{/* Error */}
							{error && (
								<div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5">
									<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
									<div className="space-y-1">
										<p className="text-xs font-medium text-destructive">Error</p>
										<p className="text-[11px] text-destructive/80 leading-relaxed">{error}</p>
										{error.includes('API key') && (
											<Button
												variant="link"
												size="sm"
												className="h-auto p-0 text-[11px] text-destructive underline"
												onClick={() => onChangeActiveTool('settings')}>
												Open Settings →
											</Button>
										)}
									</div>
								</div>
							)}

							{/* Privacy note */}
							<p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2 pb-2">
								🔒 Your image is sent directly from your browser to Remove.bg — never via our servers.
							</p>
						</div>
					</ScrollArea>
				</div>

				<ToolSidebarClose onClick={onClose} />
			</div>
		</aside>
	);
};
