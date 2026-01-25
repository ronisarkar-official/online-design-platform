'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from './features/projects/components/project-card';
import { NewProjectDialog } from './features/projects/components/new-project-dialog';
import { projectStorage } from './features/projects/storage';
import { Project } from './features/projects/types';

export default function Home() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showNewProject, setShowNewProject] = useState(false);

	// Load projects on mount
	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = () => {
		const allProjects = projectStorage.getAll();
		// Sort by updated date (newest first)
		allProjects.sort((a, b) => b.updatedAt - a.updatedAt);
		setProjects(allProjects);
	};

	const handleDelete = (id: string) => {
		projectStorage.delete(id);
		loadProjects();
	};

	// Filter projects based on search query
	const filteredProjects = projects.filter((project) =>
		project.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
			{/* Header */}
			<header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
								<Sparkles className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									Image Editor
								</h1>
								<p className="text-sm text-gray-500">Create stunning designs</p>
							</div>
						</div>

						<Button
							onClick={() => setShowNewProject(true)}
							size="lg"
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
							<Plus className="w-5 h-5 mr-2" />
							New Project
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
					<div className="text-center py-12">
						<Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No projects found
						</h3>
						<p className="text-gray-500">Try a different search term</p>
					</div>
				) : (
					// Empty state
					<div className="text-center py-20">
						<div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<Sparkles className="w-12 h-12 text-blue-600" />
						</div>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Start Creating Something Amazing
						</h2>
						<p className="text-gray-500 mb-8 max-w-md mx-auto">
							Create your first design project. Choose from templates or start from
							scratch.
						</p>
						<Button
							onClick={() => setShowNewProject(true)}
							size="lg"
							className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
							<Plus className="w-5 h-5 mr-2" />
							Create Your First Project
						</Button>
					</div>
				)}
			</main>

			{/* New Project Dialog */}
			<NewProjectDialog open={showNewProject} onOpenChange={setShowNewProject} />
		</div>
	);
}
