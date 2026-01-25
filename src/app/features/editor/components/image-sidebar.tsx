import React, { useEffect, useRef, useState } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { unsplash } from '@/lib/unsplash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ImageSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({
	editor,
	activeTool,
	onChangeActiveTool,
}: ImageSidebarProps) => {
	const [images, setImages] = useState<
		Array<{
			id: string;
			urls: { small: string; regular: string };
			alt_description: string | null;
			user: { name: string };
		}>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [initialFetched, setInitialFetched] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	const onClose = () => onChangeActiveTool('select');

	const fetchRandomImages = async () => {
		if (isLoading) return;
		setError(null);
		setIsLoading(true);
		abortRef.current?.abort();
		abortRef.current = new AbortController();

		try {
			const result = await unsplash.photos.getRandom({
				count: 30,
				collectionIds: ['317099'],
			});
			if (result.response) {
				const responseImages = (
					Array.isArray(result.response) ? result.response : [result.response]
				) as any;
				setImages(responseImages);
			}
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				setError('Failed to load images. Try again.');
				console.error('Failed to fetch images:', err);
			}
		} finally {
			setIsLoading(false);
			setInitialFetched(true);
		}
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return fetchRandomImages();
		setError(null);
		setIsLoading(true);
		abortRef.current?.abort();
		abortRef.current = new AbortController();

		try {
			const result = await unsplash.search.getPhotos({
				query: searchQuery,
				perPage: 30,
			});
			if (result.response) {
				setImages(result.response.results as any);
			}
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				setError('Search failed. Try a different term.');
				console.error('Failed to search images:', err);
			}
		} finally {
			setIsLoading(false);
			setInitialFetched(true);
		}
	};

	useEffect(() => {
		if (!initialFetched) fetchRandomImages();
		return () => abortRef.current?.abort();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				activeTool === 'image' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'image'}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="Images"
					description="Add images to your canvas"
				/>

				<div className="p-4 border-b space-y-3">
					<form
						onSubmit={handleSearch}
						className="flex gap-2"
						role="search"
						aria-label="Search images">
						<Input
							placeholder="Search images (e.g., mountains, coffee)"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="flex-1"
							aria-label="Search images"
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

					<div className="flex gap-2">
						<Button
							onClick={fetchRandomImages}
							variant="outline"
							className="flex-1"
							disabled={isLoading}
							aria-disabled={isLoading}>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Random
						</Button>
						<Button
							onClick={() => {
								setSearchQuery('');
								setImages([]);
								fetchRandomImages();
							}}
							variant="ghost"
							className="px-3"
							aria-label="Reset">
							Reset
						</Button>
					</div>

					{error ? (
						<div
							role="status"
							aria-live="polite"
							className="text-sm text-red-600">
							{error}
						</div>
					) : null}
				</div>

				{/* Image list area with explicit scrollbar */}
				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-4">
							{/* Loading skeletons */}
							{isLoading && images.length === 0 ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
									{Array.from({ length: 8 }).map((_, i) => (
										<div
											key={i}
											className="h-[110px] rounded-sm bg-muted animate-pulse"
										/>
									))}
								</div>
							) : images.length === 0 ? (
								/* Empty state */
								<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
									<p className="mb-3">No images yet.</p>
									<Button
										onClick={fetchRandomImages}
										variant="outline">
										Load random images
									</Button>
								</div>
							) : (
								/* The scrollable image grid container — this always shows a scrollbar when content overflows */
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
									{images.map((image) => (
										<button
											key={image.id}
											type="button"
											onClick={() => {
												editor?.addImage(image.urls.regular);
												onChangeActiveTool('select');
											}}
											className="relative w-full h-[110px] group rounded-sm overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
											aria-label={`Insert image by ${
												image.user?.name || 'unknown'
											}`}>
											<Image
												fill
												src={image.urls.small}
												alt={
													image.alt_description ||
													`Image by ${image.user?.name || 'Unsplash'}`
												}
												className="object-cover"
												sizes="(max-width: 640px) 50vw, 33vw"
											/>
											<div
												className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2"
												aria-hidden>
												<div className="flex items-center justify-between w-full text-xs text-white">
													<span className="truncate">{image.user?.name}</span>
													<ExternalLink className="h-3 w-3 opacity-80" />
												</div>
											</div>
										</button>
									))}
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
