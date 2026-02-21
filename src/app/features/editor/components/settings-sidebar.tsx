'use client';

import React, { useState } from 'react';
import { ActiveTool } from '../types';
import { ToolSidebarHeader } from './tool-sidebar-header';
import { ToolSidebarClose } from './tool-sidebar-close';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Eye,
	EyeOff,
	Save,
	RotateCcw,
	CheckCircle2,
	Key,
	ImageMinus,
	Banana,
	Search,
	Sparkles,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKeyConfig {
	id: string;
	label: string;
	description: string;
	placeholder: string;
	icon: React.ReactNode;
	docsUrl?: string;
	accentColor: string;
}

interface SettingsSidebarProps {
	activeTool: ActiveTool;
	onChangeActiveTool: (tool: ActiveTool) => void;
}

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'editor_api_keys';

function loadKeys(): Record<string, string> {
	if (typeof window === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
	} catch {
		return {};
	}
}

function saveKeys(keys: Record<string, string>) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

// ─── Key definitions ─────────────────────────────────────────────────────────

const API_KEY_CONFIGS: ApiKeyConfig[] = [
	{
		id: 'bg_remove',
		label: 'Background Remove',
		description: 'Used for AI-powered background removal from images.',
		placeholder: 'Enter your Remove.bg API key…',
		icon: <ImageMinus className="h-4 w-4" />,
		docsUrl: 'https://www.remove.bg/api',
		accentColor: 'text-rose-500',
	},
	{
		id: 'nano_banana',
		label: 'NanoBanana',
		description: 'Powers the NanoBanana AI generation features.',
		placeholder: 'Enter your NanoBanana API key…',
		icon: <Banana className="h-4 w-4" />,
		docsUrl: 'https://app.nanobanana.io',
		accentColor: 'text-yellow-500',
	},
	{
		id: 'unsplash',
		label: 'Unsplash',
		description: 'Fetch royalty-free images for your designs.',
		placeholder: 'Enter your Unsplash Access Key…',
		icon: <Search className="h-4 w-4" />,
		docsUrl: 'https://unsplash.com/developers',
		accentColor: 'text-blue-500',
	},
	{
		id: 'openai',
		label: 'OpenAI',
		description: 'Used for AI text & image generation tools.',
		placeholder: 'sk-…',
		icon: <Sparkles className="h-4 w-4" />,
		docsUrl: 'https://platform.openai.com/api-keys',
		accentColor: 'text-emerald-500',
	},
];

// ─── Individual key card ──────────────────────────────────────────────────────

interface KeyCardProps {
	config: ApiKeyConfig;
	value: string;
	saved: boolean;
	onChange: (val: string) => void;
	onSave: () => void;
	onClear: () => void;
}

const KeyCard = ({ config, value, saved, onChange, onSave, onClear }: KeyCardProps) => {
	const [visible, setVisible] = useState(false);

	return (
		<div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
			{/* Header row */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className={cn('p-1.5 rounded-md bg-muted', config.accentColor)}>
						{config.icon}
					</span>
					<div>
						<p className="text-sm font-semibold leading-tight">{config.label}</p>
						{config.docsUrl && (
							<a
								href={config.docsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors">
								Get API key ↗
							</a>
						)}
					</div>
				</div>
				{saved && (
					<span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium shrink-0">
						<CheckCircle2 className="h-3.5 w-3.5" />
						Saved
					</span>
				)}
			</div>

			{/* Description */}
			<p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>

			{/* Input row */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Input
						type={visible ? 'text' : 'password'}
						placeholder={config.placeholder}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="pr-9 text-sm font-mono"
						aria-label={`${config.label} API key`}
					/>
					<button
						type="button"
						onClick={() => setVisible((v) => !v)}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label={visible ? 'Hide key' : 'Show key'}>
						{visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
					</button>
				</div>

				<Button
					size="icon"
					variant="default"
					onClick={onSave}
					disabled={!value.trim()}
					aria-label={`Save ${config.label} key`}
					className="shrink-0">
					<Save className="h-4 w-4" />
				</Button>

				<Button
					size="icon"
					variant="outline"
					onClick={onClear}
					disabled={!value.trim() && !saved}
					aria-label={`Clear ${config.label} key`}
					className="shrink-0">
					<RotateCcw className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export const SettingsSidebar = ({ activeTool, onChangeActiveTool }: SettingsSidebarProps) => {
	const [values, setValues] = useState<Record<string, string>>(() => {
		if (typeof window === 'undefined') return {};
		return loadKeys();
	});
	const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>(() => {
		if (typeof window === 'undefined') return {};
		const stored = loadKeys();
		const initial: Record<string, boolean> = {};
		Object.keys(stored).forEach((k) => {
			if (stored[k]) initial[k] = true;
		});
		return initial;
	});
	const [saveAll, setSaveAll] = useState(false);

	const onClose = () => onChangeActiveTool('select');

	const handleChange = (id: string, val: string) => {
		setValues((prev) => ({ ...prev, [id]: val }));
		// Reset saved indicator when the user starts editing
		setSavedKeys((prev) => ({ ...prev, [id]: false }));
	};

	const handleSave = (id: string) => {
		const current = loadKeys();
		current[id] = values[id] || '';
		saveKeys(current);
		setSavedKeys((prev) => ({ ...prev, [id]: true }));
	};

	const handleClear = (id: string) => {
		setValues((prev) => ({ ...prev, [id]: '' }));
		const current = loadKeys();
		delete current[id];
		saveKeys(current);
		setSavedKeys((prev) => ({ ...prev, [id]: false }));
	};

	const handleSaveAll = () => {
		const all: Record<string, string> = {};
		const saved: Record<string, boolean> = {};
		API_KEY_CONFIGS.forEach(({ id }) => {
			if (values[id]) {
				all[id] = values[id];
				saved[id] = true;
			}
		});
		saveKeys(all);
		setSavedKeys(saved);
		setSaveAll(true);
		setTimeout(() => setSaveAll(false), 2000);
	};

	return (
		<aside
			className={cn(
				'w-full md:w-80 h-full absolute left-0 md:left-[60px] z-40',
				activeTool === 'settings' ? 'block' : 'hidden',
			)}
			aria-hidden={activeTool !== 'settings'}>
			<div className="w-full h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
				{/* Header */}
				<ToolSidebarHeader
					title="Settings"
					description="Manage your API keys and preferences"
				/>

				{/* Content */}
				<div className="flex-1 min-h-10 overflow-hidden">
					<ScrollArea className="h-full">
					<div className="p-4 space-y-4">
						{/* Section heading */}
						<div className="flex items-center gap-2 pb-1">
							<div className="p-1.5 rounded-md bg-primary/10 text-primary">
								<Key className="h-4 w-4" />
							</div>
							<div>
								<p className="text-sm font-semibold">API Keys</p>
								<p className="text-[11px] text-muted-foreground">
									Stored securely in your browser — never sent to our servers.
								</p>
							</div>
						</div>

						<div className="h-px bg-border" />

						{/* Key cards */}
						{API_KEY_CONFIGS.map((config) => (
							<KeyCard
								key={config.id}
								config={config}
								value={values[config.id] || ''}
								saved={!!savedKeys[config.id]}
								onChange={(val) => handleChange(config.id, val)}
								onSave={() => handleSave(config.id)}
								onClear={() => handleClear(config.id)}
							/>
						))}

						{/* Save all */}
						<Button
							className="w-full gap-2 mt-2"
							onClick={handleSaveAll}
							variant={saveAll ? 'outline' : 'default'}>
							{saveAll ? (
								<>
									<CheckCircle2 className="h-4 w-4 text-emerald-500" />
									All keys saved!
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									Save all keys
								</>
							)}
						</Button>

						{/* Privacy notice */}
						<p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2 pb-2">
							🔒 API keys are saved only in your browser&apos;s local storage and are never
							transmitted to any external server.
						</p>
					</div>
				</ScrollArea>
				</div>

				<ToolSidebarClose onClick={onClose} />
			</div>
		</aside>
	);
};
