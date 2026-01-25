import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutsDialog = () => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				setIsOpen(true);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	const shortcuts = [
		{ key: 'Ctrl + Z', description: 'Undo' },
		{ key: 'Ctrl + Y', description: 'Redo' },
		{ key: 'Ctrl + C', description: 'Copy' },
		{ key: 'Ctrl + V', description: 'Paste' },
		{ key: 'Delete', description: 'Delete selected object' },
		{ key: 'Ctrl + A', description: 'Select all' },
		{ key: 'Esc', description: 'Deselect all' },
		{ key: 'Arrows', description: 'Move selected object' },
		{ key: 'Shift + Arrows', description: 'Move selected object (fast)' },
		{ key: 'Ctrl + ?', description: 'Show shortcuts' },
	];

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				className="fixed bottom-4 right-4 z-50 rounded-full bg-background shadow-md hover:bg-muted"
				onClick={() => setIsOpen(true)}
				title="Keyboard Shortcuts (Ctrl + ?)"
			>
				<Keyboard className="h-5 w-5" />
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Keyboard Shortcuts</DialogTitle>
						<DialogDescription>
							Speed up your workflow with these shortcuts.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							{shortcuts.map((shortcut, index) => (
								<div key={index} className="flex items-center justify-between border-b pb-2">
									<span className="text-sm text-muted-foreground">{shortcut.description}</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
										{shortcut.key}
									</kbd>
								</div>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
