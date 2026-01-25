'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEMPLATES, ProjectTemplate } from '../types';
import { projectStorage } from '../storage';

interface NewProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const NewProjectDialog = ({
	open,
	onOpenChange,
}: NewProjectDialogProps) => {
	const router = useRouter();
	const [projectName, setProjectName] = useState('Untitled Design');
	const [customWidth, setCustomWidth] = useState(1920);
	const [customHeight, setCustomHeight] = useState(1080);

	const handleCreateProject = (template: ProjectTemplate) => {
		const project = {
			id: uuid(),
			name: projectName || 'Untitled Design',
			width: template.id === 'custom' ? customWidth : template.width,
			height: template.id === 'custom' ? customHeight : template.height,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		projectStorage.save(project);
		router.push(`/editor/${project.id}`);
	};

	const templatesByCategory = {
		social: TEMPLATES.filter((t) => t.category === 'social'),
		print: TEMPLATES.filter((t) => t.category === 'print'),
		custom: TEMPLATES.filter((t) => t.category === 'custom'),
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Create New Project</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Project Name */}
					<div className="space-y-2">
						<Label htmlFor="project-name">Project Name</Label>
						<Input
							id="project-name"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							placeholder="Enter project name"
						/>
					</div>

					{/* Templates */}
					<Tabs
						defaultValue="social"
						className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="social">Social Media</TabsTrigger>
							<TabsTrigger value="print">Print</TabsTrigger>
							<TabsTrigger value="custom">Custom</TabsTrigger>
						</TabsList>

						{/* Social Media Templates */}
						<TabsContent
							value="social"
							className="space-y-3 mt-4">
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{templatesByCategory.social.map((template) => (
									<button
										key={template.id}
										onClick={() => handleCreateProject(template)}
										className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left group">
										<div className="font-semibold text-gray-900 group-hover:text-blue-600">
											{template.name}
										</div>
										<div className="text-sm text-gray-500 mt-1">
											{template.description}
										</div>
									</button>
								))}
							</div>
						</TabsContent>

						{/* Print Templates */}
						<TabsContent
							value="print"
							className="space-y-3 mt-4">
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{templatesByCategory.print.map((template) => (
									<button
										key={template.id}
										onClick={() => handleCreateProject(template)}
										className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left group">
										<div className="font-semibold text-gray-900 group-hover:text-blue-600">
											{template.name}
										</div>
										<div className="text-sm text-gray-500 mt-1">
											{template.description}
										</div>
									</button>
								))}
							</div>
						</TabsContent>

						{/* Custom Size */}
						<TabsContent
							value="custom"
							className="space-y-4 mt-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="custom-width">Width (px)</Label>
									<Input
										id="custom-width"
										type="number"
										value={customWidth}
										onChange={(e) => setCustomWidth(Number(e.target.value))}
										min={100}
										max={10000}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="custom-height">Height (px)</Label>
									<Input
										id="custom-height"
										type="number"
										value={customHeight}
										onChange={(e) => setCustomHeight(Number(e.target.value))}
										min={100}
										max={10000}
									/>
								</div>
							</div>

							<Button
								onClick={() =>
									handleCreateProject(TEMPLATES[TEMPLATES.length - 1])
								}
								className="w-full"
								size="lg">
								Create Custom Project
							</Button>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
};
