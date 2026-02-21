'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Editor } from '@/app/features/editor/components/editor';
import { projectStorage } from '@/app/features/projects/storage';

const EditorProjectIdPage = () => {
	const params = useParams();
	const router = useRouter();
	const projectId = params.projectId as string;

	// Track whether the component has mounted (client-side only)
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Derive project from mounted state — avoids calling setState in effects
	const project = useMemo(() => {
		if (!isMounted) return null;
		return projectStorage.getById(projectId);
	}, [isMounted, projectId]);

	// Redirect if project not found (only after mount)
	useEffect(() => {
		if (isMounted && !project) {
			router.replace('/');
		}
	}, [isMounted, project, router]);

	if (!isMounted || !project) {
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
