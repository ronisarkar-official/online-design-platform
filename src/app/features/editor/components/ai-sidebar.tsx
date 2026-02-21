'use client';

import React, { useState, useRef } from 'react';
import { ActiveTool, Editor } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
	Loader2,
	Sparkles,
	KeyRound,
	ArrowRight,
	Plus,
	RotateCcw,
	ImageIcon,
	AlertCircle,
	CheckCircle2,
	ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getStoredKeys(): Record<string, string> {
	if (typeof window === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem('editor_api_keys') || '{}');
	} catch {
		return {};
	}
}

// ─── Provider definitions ─────────────────────────────────────────────────────

type Provider = 'openai' | 'nano_banana';

interface ProviderConfig {
	id: Provider;
	label: string;
	storageKey: string;
	docsUrl: string;
	models: { id: string; label: string }[];
	defaultModel: string;
	sizes: { id: string; label: string }[];
	defaultSize: string;
}

const PROVIDERS: ProviderConfig[] = [
	{
		id: 'openai',
		label: 'ChatGPT / DALL·E',
		storageKey: 'openai',
		docsUrl: 'https://platform.openai.com/api-keys',
		models: [
			{ id: 'dall-e-3', label: 'DALL·E 3 (best quality)' },
			{ id: 'dall-e-2', label: 'DALL·E 2 (faster)' },
		],
		defaultModel: 'dall-e-3',
		sizes: [
			{ id: '1024x1024', label: '1024 × 1024 (square)' },
			{ id: '1792x1024', label: '1792 × 1024 (landscape)' },
			{ id: '1024x1792', label: '1024 × 1792 (portrait)' },
		],
		defaultSize: '1024x1024',
	},
	{
		id: 'nano_banana',
		label: 'NanoBanana AI',
		storageKey: 'nano_banana',
		docsUrl: 'https://app.nanobanana.io',
		models: [{ id: 'default', label: 'Default model' }],
		defaultModel: 'default',
		sizes: [
			{ id: '512x512', label: '512 × 512' },
			{ id: '1024x1024', label: '1024 × 1024' },
		],
		defaultSize: '512x512',
	},
];

// ─── Generation helpers ───────────────────────────────────────────────────────

async function generateWithOpenAI(
	apiKey: string,
	prompt: string,
	model: string,
	size: string,
): Promise<string> {
	const response = await fetch('https://api.openai.com/v1/images/generations', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			prompt,
			n: 1,
			size,
			response_format: 'url',
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
		const msg = err?.error?.message || response.statusText;
		if (response.status === 401) throw new Error('Invalid OpenAI API key. Check it in Settings.');
		if (response.status === 429) throw new Error('OpenAI rate limit hit. Try again in a moment.');
		throw new Error(`OpenAI error: ${msg}`);
	}

	const data = await response.json();
	const url: string = data?.data?.[0]?.url;
	if (!url) throw new Error('OpenAI returned no image URL.');
	return url;
}

async function generateWithNanoBanana(
	apiKey: string,
	prompt: string,
	_model: string,
	size: string,
): Promise<string> {
	// NanoBanana image generation endpoint
	const [width, height] = size.split('x').map(Number);
	const response = await fetch('https://api.nanobanana.io/v1/images/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({ prompt, width, height }),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		const msg = err?.error || err?.message || response.statusText;
		if (response.status === 401) throw new Error('Invalid NanoBanana API key. Check it in Settings.');
		throw new Error(`NanoBanana error: ${msg}`);
	}

	const data = await response.json();
	// NanoBanana may return { url } or { image_url } or { data: [{ url }] }
	const url: string = data?.url || data?.image_url || data?.data?.[0]?.url;
	if (!url) throw new Error('NanoBanana returned no image URL.');
	return url;
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
	'A glowing neon city at dusk, cyberpunk style',
	'Cozy coffee shop on a rainy morning, watercolor',
	'Abstract flowing shapes in teal and gold',
	'Minimalist mountain landscape at sunrise',
	'Futuristic robot portrait, dramatic lighting',
	'Vintage botanical illustration of exotic flowers',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiSidebarProps {
	editor: Editor | undefined;
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AiSidebar = ({ editor, activeTool, onChangeActiveTool }: AiSidebarProps) => {
	const [prompt, setPrompt] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [selectedProvider, setSelectedProvider] = useState<Provider>('openai');
	const [selectedModel, setSelectedModel] = useState(PROVIDERS[0].defaultModel);
	const [selectedSize, setSelectedSize] = useState(PROVIDERS[0].defaultSize);
	const [showOptions, setShowOptions] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const onClose = () => onChangeActiveTool('select');

	const keys = getStoredKeys();
	const providerConfig = PROVIDERS.find((p) => p.id === selectedProvider)!;
	const hasCurrentKey = !!keys[providerConfig.storageKey];

	const availableProviders = PROVIDERS.filter((p) => !!keys[p.storageKey]);
	const noKeysAtAll = availableProviders.length === 0;

	const handleProviderChange = (id: Provider) => {
		setSelectedProvider(id);
		const cfg = PROVIDERS.find((p) => p.id === id)!;
		setSelectedModel(cfg.defaultModel);
		setSelectedSize(cfg.defaultSize);
		setResultUrl(null);
		setError(null);
	};

	const handleGenerate = async () => {
		if (!prompt.trim() || !editor) return;

		const apiKey = keys[providerConfig.storageKey];
		if (!apiKey) {
			setError(`No ${providerConfig.label} API key found. Add it in Settings.`);
			return;
		}

		setIsGenerating(true);
		setError(null);
		setResultUrl(null);

		try {
			let url: string;
			if (selectedProvider === 'openai') {
				url = await generateWithOpenAI(apiKey, prompt.trim(), selectedModel, selectedSize);
			} else {
				url = await generateWithNanoBanana(apiKey, prompt.trim(), selectedModel, selectedSize);
			}
			setResultUrl(url);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Generation failed. Try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	const handleAddToCanvas = () => {
		if (!resultUrl || !editor) return;
		editor.addImage(resultUrl);
		onChangeActiveTool('select');
	};

	const handleRetry = () => {
		setResultUrl(null);
		setError(null);
		textareaRef.current?.focus();
	};

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				activeTool === 'ai' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'ai'}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				<ToolSidebarHeader
					title="AI Image Generator"
					description="Generate images from text with AI"
				/>

				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
						<div className="p-4 space-y-4">

							{/* No keys at all — prompt to settings */}
							{noKeysAtAll && (
								<div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 space-y-2.5">
									<div className="flex items-start gap-2">
										<KeyRound className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
										<div>
											<p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
												API Key Required
											</p>
											<p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
												Add an{' '}
												<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">OpenAI</a>
												{' '}or{' '}
												<a href="https://app.nanobanana.io" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">NanoBanana</a>
												{' '}API key in Settings to start generating images.
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

							{/* Provider selector — only show if multiple keys or for info */}
							{!noKeysAtAll && (
								<div className="space-y-1.5">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider</p>
									<div className="grid grid-cols-2 gap-2">
										{PROVIDERS.map((p) => {
											const active = selectedProvider === p.id;
											const configured = !!keys[p.storageKey];
											return (
												<button
													key={p.id}
													type="button"
													onClick={() => handleProviderChange(p.id)}
													className={cn(
														'relative rounded-lg border px-3 py-2 text-left text-xs transition-all duration-150',
														active
															? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
															: 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
														!configured && 'opacity-40 cursor-not-allowed',
													)}
													disabled={!configured}
													title={!configured ? `Add a ${p.label} key in Settings` : undefined}>
													{p.label}
													{configured && (
														<span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
													)}
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Advanced options toggle */}
							{hasCurrentKey && (
								<div>
									<button
										type="button"
										onClick={() => setShowOptions((v) => !v)}
										className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
										<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showOptions && 'rotate-180')} />
										{showOptions ? 'Hide options' : 'Show options'}
									</button>

									{showOptions && (
										<div className="mt-3 space-y-3 border-l-2 border-muted ml-1.5 pl-3">
											{/* Model */}
											<div className="space-y-1">
												<label className="text-[11px] font-medium text-muted-foreground">Model</label>
												<select
													value={selectedModel}
													onChange={(e) => setSelectedModel(e.target.value)}
													className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
													{providerConfig.models.map((m) => (
														<option key={m.id} value={m.id}>{m.label}</option>
													))}
												</select>
											</div>

											{/* Size */}
											<div className="space-y-1">
												<label className="text-[11px] font-medium text-muted-foreground">Image Size</label>
												<select
													value={selectedSize}
													onChange={(e) => setSelectedSize(e.target.value)}
													className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
													{providerConfig.sizes.map((s) => (
														<option key={s.id} value={s.id}>{s.label}</option>
													))}
												</select>
											</div>
										</div>
									)}
								</div>
							)}

							<div className="h-px bg-border" />

							{/* Prompt input */}
							<div className="space-y-2">
								<label className="text-sm font-medium flex items-center gap-1.5">
									<Sparkles className="h-3.5 w-3.5 text-primary" />
									Describe your image
								</label>
								<Textarea
									ref={textareaRef}
									placeholder="A serene mountain lake at golden hour with reflections of pine trees…"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
										if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
									}}
									rows={4}
									className="resize-none text-sm leading-relaxed"
									disabled={isGenerating || noKeysAtAll}
								/>
								<p className="text-[11px] text-muted-foreground text-right">
									{prompt.length} chars · <kbd className="text-[10px] border rounded px-1">⌘ Enter</kbd> to generate
								</p>
							</div>

							{/* Suggestion chips */}
							{!resultUrl && !isGenerating && (
								<div className="space-y-2">
									<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Suggestions</p>
									<div className="flex flex-wrap gap-1.5">
										{SUGGESTIONS.map((s) => (
											<button
												key={s}
												type="button"
												onClick={() => {
													setPrompt(s);
													textareaRef.current?.focus();
												}}
												className="text-[11px] rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-1 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-150">
												{s.length > 36 ? s.slice(0, 34) + '…' : s}
											</button>
										))}
									</div>
								</div>
							)}

							{/* Generate button */}
							<Button
								onClick={handleGenerate}
								disabled={!prompt.trim() || isGenerating || !hasCurrentKey || noKeysAtAll}
								className="w-full gap-2"
								size="lg">
								{isGenerating ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Generating…
									</>
								) : (
									<>
										<Sparkles className="h-4 w-4" />
										Generate Image
									</>
								)}
							</Button>

							{/* Loading skeleton */}
							{isGenerating && (
								<div className="rounded-xl overflow-hidden border aspect-square w-full animate-pulse bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
									<Sparkles className="h-8 w-8 opacity-30 animate-bounce" />
									<p className="text-xs">Creating your image…</p>
									<p className="text-[11px] opacity-60">This may take 10–20 seconds</p>
								</div>
							)}

							{/* Result preview */}
							{resultUrl && !isGenerating && (
								<div className="space-y-3">
									<div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
										<CheckCircle2 className="h-3.5 w-3.5" />
										Image generated!
									</div>

									<div className="relative w-full aspect-square rounded-xl overflow-hidden border shadow-sm group">
										<Image
											src={resultUrl}
											alt={prompt}
											fill
											className="object-cover"
											sizes="320px"
											unoptimized
										/>
										{/* Overlay with prompt */}
										<div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
											<p className="text-white text-[11px] leading-snug line-clamp-3">{prompt}</p>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-2">
										<Button
											onClick={handleAddToCanvas}
											className="gap-2 w-full"
											size="sm">
											<Plus className="h-3.5 w-3.5" />
											Add to Canvas
										</Button>
										<Button
											onClick={handleRetry}
											variant="outline"
											className="gap-2 w-full"
											size="sm">
											<RotateCcw className="h-3.5 w-3.5" />
											Try Again
										</Button>
									</div>
								</div>
							)}

							{/* Error */}
							{error && (
								<div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5">
									<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
									<div className="space-y-1">
										<p className="text-xs font-medium text-destructive">Error</p>
										<p className="text-[11px] text-destructive/80 leading-relaxed">{error}</p>
										{error.toLowerCase().includes('key') && (
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

							{/* No image selected hint */}
							{!editor && (
								<div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs text-muted-foreground">
									<ImageIcon className="h-4 w-4 shrink-0" />
									Open a project to add images to the canvas.
								</div>
							)}

							{/* Privacy note */}
							<p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2 pb-2">
								🔒 Your prompt and API key are sent directly from your browser to the AI provider — never via our servers.
							</p>
						</div>
					</ScrollArea>
				</div>

				<ToolSidebarClose onClick={onClose} />
			</div>
		</aside>
	);
};
