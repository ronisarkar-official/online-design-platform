'use client';

import { Project } from '../types';
import { formatDistance } from '@/lib/utils';
import Link from 'next/link';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash } from 'lucide-react';

interface ProjectCardProps {
	project: Project;
	onDelete: (id: string) => void;
}

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		if (confirm(`Delete "${project.name}"?`)) {
			onDelete(project.id);
		}
	};

	return (
		<Link
			href={`/editor/${project.id}`}
			className="group block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-blue-400">
			<div className="aspect-video bg-gray-100 relative">
				{project.thumbnailData ? (
					<img
						src={project.thumbnailData}
						alt={project.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						<span className="text-sm">No preview</span>
					</div>
				)}

				{/* Hover overlay */}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
			</div>

			<div className="p-4 flex items-center justify-between">
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
					<p className="text-sm text-gray-500 mt-0.5">
						{project.width} × {project.height}px
					</p>
					<p className="text-xs text-gray-400 mt-1">
						Updated {formatDistance(project.updatedAt)}
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger
						onClick={(e) => e.preventDefault()}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
						<MoreVertical className="w-4 h-4 text-gray-500" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={handleDelete}
							className="text-red-600 cursor-pointer">
							<Trash className="w-4 h-4 mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Link>
	);
};
