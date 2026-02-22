'use client';
import { useState, useRef } from 'react';
import { ActiveTool, Editor } from '../types';
import { Logo } from './logo';
import { ExportDialog } from './export-dialog';
import { cn } from '@/lib/utils';
import { Hint } from '@/components/hint';
import {
	ChevronDown,
	Download,
	MousePointerClick,
	Menu,
	X,
} from 'lucide-react';
import { CiFileOn } from 'react-icons/ci';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BsCloudCheck, BsCloudSlash } from 'react-icons/bs';

interface NavbarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
	isSaved?: boolean;
}

export const Navbar = ({ editor, activeTool, onChangeActiveTool, isSaved = true }: NavbarProps) => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileOpen = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !editor) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const json = event.target?.result as string;
			if (json) {
				editor.loadJson(json);
			}
		};
		reader.readAsText(file);

		// Reset the input so the same file can be selected again
		e.target.value = '';
	};

	return (
		<>
			{/* Hidden file input for opening JSON files */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".json,application/json"
				onChange={handleFileChange}
				className="hidden"
			/>

			<nav className="w-full flex items-center px-3 sm:px-4 lg:px-8 h-[64px] sm:h-[68px] gap-x-2 sm:gap-x-4 border-b bg-background/95  sticky top-0 z-30">
				<Logo />

				{/* Desktop Navigation */}
				<div className="hidden lg:flex w-full items-center gap-x-1 h-full">
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1"
								suppressHydrationWarning={true}>
								<span className="text-sm font-medium">File</span>
								<ChevronDown className="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="min-w-60">
							<DropdownMenuItem
								className="flex items-center gap-x-3 py-3 cursor-pointer"
								onClick={handleFileOpen}>
								<div className="p-2 rounded-md bg-muted">
									<CiFileOn className="size-5" />
								</div>
								<div className="flex-1">
									<p className="font-medium">Open</p>
									<p className="text-xs text-muted-foreground">
										Open a JSON file
									</p>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Separator
						orientation="vertical"
						className="mx-1 h-6"
					/>

					<div className="flex items-center gap-x-1">
						<Hint
							label="Select (V)"
							side="bottom"
							sideOffset={10}>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onChangeActiveTool('select')}
								className={cn(
									'transition-all',
									activeTool === 'select' &&
										'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
								)}>
								<MousePointerClick className="size-4" />
							</Button>
						</Hint>
					</div>



					<Separator
						orientation="vertical"
						className="mx-2 h-6"
					/>

					<div className="flex items-center gap-x-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-default">
						{isSaved ? (
							<BsCloudCheck className="size-4 text-green-600 dark:text-green-500" />
						) : (
							<BsCloudSlash className="size-4 text-amber-600 dark:text-amber-500 animate-[pulse_1.2s_ease-in-out_infinite]" />
						)}
						<span className={cn('text-sm font-medium', !isSaved && 'animate-pulse')}>
							{isSaved ? 'Saved' : 'Saving...'}
						</span>
					</div>

					<div className="ml-auto flex items-center gap-x-2">
						<ExportDialog editor={editor}>
							<Button
								variant="default"
								size="sm"
								className="gap-2 shadow-sm"
								suppressHydrationWarning={true}>
								<Download className="size-4" />
								<span className="hidden xl:inline">Export</span>
							</Button>
						</ExportDialog>
					</div>
				</div>

				{/* Mobile/Tablet Quick Actions */}
				<div className="flex lg:hidden items-center gap-x-1 ml-auto">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onChangeActiveTool('select')}
						className={cn(
							'hidden sm:flex transition-all',
							activeTool === 'select' &&
								'bg-primary/10 text-primary hover:bg-primary/20',
						)}>
						<MousePointerClick className="size-4" />
					</Button>



					<div className="flex items-center gap-x-1 px-2">
						{isSaved ? (
							<BsCloudCheck className="size-4 text-green-600 dark:text-green-500" />
						) : (
							<BsCloudSlash className="size-4 text-amber-600 dark:text-amber-500 animate-[pulse_1.2s_ease-in-out_infinite]" />
						)}
					</div>

					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="hover:bg-muted">
						{mobileMenuOpen ? (
							<X className="size-5" />
						) : (
							<Menu className="size-5" />
						)}
					</Button>
				</div>
			</nav>

			{/* Mobile Menu Overlay with animation */}
			<div
				className={cn(
					'fixed inset-0  z-40 lg:hidden transition-opacity duration-300',
					mobileMenuOpen
						? 'opacity-100 pointer-events-auto'
						: 'opacity-0 pointer-events-none',
				)}
				onClick={() => setMobileMenuOpen(false)}
			/>

			{/* Mobile Menu Drawer - Enhanced */}
			<div
				className={cn(
					'fixed top-[64px] sm:top-[68px] right-0 h-[calc(100vh-64px)] sm:h-[calc(100vh-68px)] w-[85vw] max-w-[360px] bg-background border-l shadow-2xl z-50 transform transition-all duration-300 ease-out lg:hidden overflow-y-auto',
					mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
				)}>
				<div className="flex flex-col gap-y-6 p-6">
					{/* Status Card */}
					<div className="p-4 rounded-lg bg-muted/50 border">
						<div className="flex items-center gap-x-3">
							{isSaved ? (
								<div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
									<BsCloudCheck className="size-5 text-green-600 dark:text-green-500" />
								</div>
							) : (
								<div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
									<BsCloudSlash className="size-5 text-amber-600 dark:text-amber-500 animate-[pulse_1.2s_ease-in-out_infinite]" />
								</div>
							)}
							<div>
								<p className="font-semibold text-sm">
									{isSaved ? 'All changes saved' : 'Saving changes...'}
								</p>
								<p className="text-xs text-muted-foreground">
									{isSaved ? 'Up to date' : 'Please wait'}
								</p>
							</div>
						</div>
					</div>

					{/* Tools Section */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							Tools
						</h3>
						<Button
							variant="ghost"
							size="lg"
							onClick={() => {
								onChangeActiveTool('select');
								setMobileMenuOpen(false);
							}}
							className={cn(
								'w-full justify-start h-12 px-4 transition-all',
								activeTool === 'select' &&
									'bg-primary/10 text-primary hover:bg-primary/20 border-l-4 border-primary',
							)}>
							<MousePointerClick className="size-5 mr-3" />
							<span className="font-medium">Select Tool</span>
							<span className="ml-auto text-xs text-muted-foreground">V</span>
						</Button>
					</div>

					<Separator />

					{/* Actions Section */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							Actions
						</h3>

					</div>

					<Separator />

					{/* File Section */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							File
						</h3>
						<Button
							variant="outline"
							size="lg"
							onClick={() => {
								handleFileOpen();
								setMobileMenuOpen(false);
							}}
							className="w-full justify-start h-12 px-4">
							<CiFileOn className="size-5 mr-3" />
							<div className="text-left">
								<p className="font-medium text-sm">Open File</p>
								<p className="text-xs text-muted-foreground">Import JSON</p>
							</div>
						</Button>
					</div>

					<Separator />

					{/* Export Section */}
					<div className="space-y-3">
						<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							Export
						</h3>
						<ExportDialog editor={editor}>
							<Button
								variant="outline"
								size="lg"
								className="w-full justify-start h-12 px-4">
								<Download className="size-5 mr-3" />
								<div className="text-left">
									<p className="font-medium text-sm">Export Image</p>
									<p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP</p>
								</div>
							</Button>
						</ExportDialog>
					</div>

					{/* Bottom spacing */}
					<div className="h-4" />
				</div>
			</div>
		</>
	);
};
