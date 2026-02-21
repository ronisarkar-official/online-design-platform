'use client';

import React, {
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import * as fabric from 'fabric';
import { ActiveTool, Editor, FONT_FAMILY } from '@/app/features/editor/types';
import { ToolSidebarClose } from './tool-sidebar-close';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import {
	fetchGoogleFonts,
	type GoogleFont,
	type GoogleFontCategory,
} from '@/lib/google-fonts';

// ---------- types ----------

interface FontSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

// ---------- constants ----------

const CATEGORIES: { label: string; value: GoogleFontCategory | 'all' }[] = [
	{ label: 'All', value: 'all' },
	{ label: 'Sans', value: 'sans-serif' },
	{ label: 'Serif', value: 'serif' },
	{ label: 'Display', value: 'display' },
	{ label: 'Handwriting', value: 'handwriting' },
	{ label: 'Mono', value: 'monospace' },
];

// Inject a @font-face / Google Fonts stylesheet once per family
const injectedFonts = new Set<string>();
function injectFontPreview(family: string) {
	if (injectedFonts.has(family)) return;
	injectedFonts.add(family);
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
	document.head.appendChild(link);
}

// ---------- component ----------

const FontSidebarComponent: React.FC<FontSidebarProps> = ({
	editor,
	activeTool,
	onChangeActiveTool,
}) => {
	const onClose = useCallback(
		() => onChangeActiveTool('select'),
		[onChangeActiveTool],
	);

	// --- state ---
	const [allFonts, setAllFonts] = useState<GoogleFont[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [category, setCategory] = useState<GoogleFontCategory | 'all'>('all');
	const abortRef = useRef<AbortController | null>(null);
	const [initialFetched, setInitialFetched] = useState(false);

	// active font value
	const selected = useMemo(
		() => editor?.selectedObjects?.[0],
		[editor?.selectedObjects],
	);
	const activeFont = useMemo(() => {
		const maybeText = selected as fabric.IText | undefined;
		return maybeText?.fontFamily ?? editor?.fontFamily ?? FONT_FAMILY;
	}, [selected, editor?.fontFamily]);

	const isOpen = activeTool === 'font';

	// --- fetch ---
	const loadFonts = useCallback(async () => {
		if (isLoading) return;
		setError(null);
		setIsLoading(true);
		abortRef.current?.abort();
		abortRef.current = new AbortController();
		try {
			const fonts = await fetchGoogleFonts({
				sort: 'popularity',
				signal: abortRef.current.signal,
			});
			setAllFonts(fonts);
		} catch (err: unknown) {
			const name = err instanceof Error ? err.name : '';
			if (name !== 'AbortError') {
				const msg = err instanceof Error ? err.message : 'Failed to load fonts.';
				setError(msg);
				console.error('[FontSidebar]', err);
			}
		} finally {
			setIsLoading(false);
			setInitialFetched(true);
		}
	}, [isLoading]);

	// Fetch once on mount
	useEffect(() => {
		if (!initialFetched) loadFonts();
		return () => abortRef.current?.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// --- filtering (client-side, instant) ---
	const visibleFonts = useMemo(() => {
		let list = allFonts;
		if (category !== 'all') list = list.filter((f) => f.category === category);
		const q = searchQuery.trim().toLowerCase();
		if (q) list = list.filter((f) => f.family.toLowerCase().includes(q));
		return list.slice(0, 120); // cap for perf
	}, [allFonts, category, searchQuery]);

	// --- apply font ---
	const onChangeFontFamily = useCallback(
		(fontFamily: string) => {
			editor?.changeFontFamily(fontFamily);
		},
		[editor],
	);

	// --- search submit ---
	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			// filtering is reactive; if no fonts loaded yet, (re)fetch
			if (!initialFetched) loadFonts();
		},
		[initialFetched, loadFonts],
	);

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				isOpen ? 'block' : 'hidden',
			)}
			aria-hidden={!isOpen}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="Fonts"
					description="Choose a font for your text"
				/>

				{/* ---- search bar ---- */}
				<div className="p-4 border-b space-y-3">
					<form
						onSubmit={handleSearch}
						className="flex gap-2"
						role="search"
						aria-label="Search fonts">
						<Input
							placeholder="Search fonts…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1"
							aria-label="Search fonts"
						/>
						<Button
							type="submit"
							size="icon"
							disabled={isLoading}
							aria-label="Search"
							title="Search">
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Search className="h-4 w-4" />
							)}
						</Button>
					</form>

					{/* ---- category pills ---- */}
					<div className="flex flex-wrap gap-1">
						{CATEGORIES.map((cat) => (
							<button
								key={cat.value}
								onClick={() => setCategory(cat.value)}
								className={cn(
									'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
									category === cat.value
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground hover:bg-muted/70',
								)}>
								{cat.label}
							</button>
						))}
					</div>

					{error && (
						<div role="status" aria-live="polite" className="text-sm text-red-600">
							{error}{' '}
							<button
								onClick={loadFonts}
								className="underline text-primary ml-1">
								Retry
							</button>
						</div>
					)}
				</div>

				{/* ---- font grid ---- */}
				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-4">
							{/* Loading skeletons */}
							{isLoading && allFonts.length === 0 ? (
								<div className="grid grid-cols-2 gap-2">
									{Array.from({ length: 12 }).map((_, i) => (
										<div
											key={i}
											className="h-[64px] rounded-md bg-muted animate-pulse"
										/>
									))}
								</div>
							) : visibleFonts.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
									<p className="mb-3">No fonts found.</p>
									<Button onClick={loadFonts} variant="outline">
										Reload fonts
									</Button>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-2">
									{visibleFonts.map((font) => {
										const isActive = activeFont === font.family;
										return (
											<FontCard
												key={font.family}
												font={font}
												isActive={isActive}
												onClick={onChangeFontFamily}
											/>
										);
									})}
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

// ---------- font card (memoized to prevent re-renders on scroll) ----------

interface FontCardProps {
	font: GoogleFont;
	isActive: boolean;
	onClick: (family: string) => void;
}

const FontCard = memo(({ font, isActive, onClick }: FontCardProps) => {
	// Inject font stylesheet lazily on first render of this card
	useEffect(() => {
		injectFontPreview(font.family);
	}, [font.family]);

	return (
		<Button
			variant={isActive ? 'default' : 'outline'}
			size="sm"
			onClick={() => onClick(font.family)}
			className="h-auto p-3 flex flex-col items-center justify-center text-xs w-full">
			<span
				className="text-lg leading-tight truncate w-full text-center"
				style={{ fontFamily: font.family }}>
				Aa
			</span>
			<span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
				{font.family}
			</span>
		</Button>
	);
});
FontCard.displayName = 'FontCard';

export const FontSidebar = memo(FontSidebarComponent);
FontSidebar.displayName = 'FontSidebar';
