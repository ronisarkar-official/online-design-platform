'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Editor } from '@/app/features/editor/components/editor';
import { projectStorage } from '@/app/features/projects/storage';

const EditorProjectIdPage = () => {
	const params = useParams();
	const router = useRouter();
	const projectId = params.projectId as string;

	// Get project data synchronously on initial render
	const project = useMemo(() => {
		const projectData = projectStorage.getById(projectId);
		if (!projectData) {
			// Client-side redirect if project doesn't exist
			if (typeof window !== 'undefined') {
				router.replace('/');
			}
			return null;
		}
		return projectData;
	}, [projectId, router]);

	if (!project) {
		return (
			<div className="h-screen flex items-center justify-center bg-muted">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<Editor
			projectId={projectId}
			defaultWidth={project.width}
			defaultHeight={project.height}
		/>
	);
};

export default EditorProjectIdPage;
