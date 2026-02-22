'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { ProjectCard } from './features/projects/components/project-card';
import { NewProjectDialog } from './features/projects/components/new-project-dialog';
import { projectStorage } from './features/projects/storage';
import { Project } from './features/projects/types';

function isProjectShape(data: unknown): data is Project {
	return (
		typeof data === 'object' &&
		data !== null &&
		'id' in data &&
		'name' in data &&
		'width' in data &&
		'height' in data
	);
}

function isCanvasJson(data: unknown): data is { objects?: unknown[]; width?: number; height?: number } {
	return typeof data === 'object' && data !== null && 'objects' in data;
}

export default function Home() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showNewProject, setShowNewProject] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load projects on mount
	useEffect(() => {
		const allProjects = projectStorage.getAll();
		// Sort by updated date (newest first)
		allProjects.sort((a, b) => b.updatedAt - a.updatedAt);
		setProjects(allProjects);
	}, []);

	function loadProjects() {
		const allProjects = projectStorage.getAll();
		// Sort by updated date (newest first)
		allProjects.sort((a, b) => b.updatedAt - a.updatedAt);
		setProjects(allProjects);
	}

	const handleDelete = (id: string) => {
		projectStorage.delete(id);
		loadProjects();
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = event.target?.result as string;
				if (!json) return;
				const data = JSON.parse(json) as unknown;

				const now = Date.now();
				if (isProjectShape(data)) {
					const imported: Project = {
						...data,
						id: crypto.randomUUID(),
						name: `Imported: ${data.name}`,
						createdAt: now,
						updatedAt: now,
					};
					projectStorage.save(imported);
				} else if (isCanvasJson(data)) {
					const width = data.width ?? 800;
					const height = data.height ?? 600;
					const imported: Project = {
						id: crypto.randomUUID(),
						name: 'Imported Project',
						width,
						height,
						canvasData: JSON.stringify(data),
						createdAt: now,
						updatedAt: now,
					};
					projectStorage.save(imported);
				} else {
					console.warn('Unknown JSON format, skipping import');
					return;
				}
				loadProjects();
			} catch (err) {
				console.error('Failed to import project:', err);
			}
		};
		reader.readAsText(file);
		e.target.value = '';
	};

	// Filter projects based on search query
	const filteredProjects = projects.filter((project) =>
		project.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
			{/* Hidden file input for importing project JSON */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".json,application/json"
				onChange={handleImportFileChange}
				className="hidden"
			/>

			{/* Header */}
			<header className="border-b  bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
							<Sparkles className="w-4 h-4" />
						</div>
						<div className="flex flex-col">
							<h1 className="text-xl font-semibold tracking-tight">
								Image Editor
							</h1>
							<p className="text-xs text-muted-foreground font-medium hidden sm:block">
								Create stunning designs
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							onClick={handleImportClick}
							className="gap-2 h-9 px-4"
							variant="outline">
							<Upload className="w-4 h-4" />
							<span className="hidden sm:inline">Import Project</span>
							<span className="sm:hidden">Import</span>
						</Button>
						<Button
							onClick={() => setShowNewProject(true)}
							className="gap-2 h-9 px-4"
							variant="default">
							<Plus className="w-4 h-4" />
							<span className="hidden sm:inline">New Project</span>
							<span className="sm:hidden">New</span>
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Search Bar */}
				{projects.length > 0 && (
					<div className="mb-8">
						<div className="relative max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
							<Input
								type="text"
								placeholder="Search projects..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
				)}

				{/* Projects Grid */}
				{filteredProjects.length > 0 ? (
					<>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Your Projects ({filteredProjects.length})
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{filteredProjects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									onDelete={handleDelete}
								/>
							))}
						</div>
					</>
				) : projects.length > 0 ? (
					// No search results
					<Empty>
						<EmptyMedia>
							<Search />
						</EmptyMedia>
						<EmptyTitle>No projects found</EmptyTitle>
						<EmptyDescription>Try a different search term</EmptyDescription>
					</Empty>
				) : (
					// Empty state
					<Empty>
						<EmptyMedia>
							<Sparkles />
						</EmptyMedia>
						<EmptyTitle>Start Creating Something Amazing</EmptyTitle>
						<EmptyDescription>
							Create your first design project. Choose from templates or start from
							scratch.
						</EmptyDescription>
						<EmptyContent>
							<div className="flex flex-wrap gap-3 justify-center">
								<Button onClick={() => setShowNewProject(true)}>
									<Plus className="w-4 h-4 mr-2" />
									Create Your First Project
								</Button>
								<Button onClick={handleImportClick} variant="outline">
									<Upload className="w-4 h-4 mr-2" />
									Import Project
								</Button>
							</div>
						</EmptyContent>
					</Empty>
				)}
			</main>

			{/* New Project Dialog */}
			<NewProjectDialog open={showNewProject} onOpenChange={setShowNewProject} />
		</div>
	);
}
