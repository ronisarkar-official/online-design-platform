import { Project } from './types';

const STORAGE_KEY = 'image-editor-projects';

export const projectStorage = {
	// Get all projects
	getAll(): Project[] {
		if (typeof window === 'undefined') return [];
		
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Error loading projects:', error);
			return [];
		}
	},

	// Get a single project by ID
	getById(id: string): Project | null {
		const projects = this.getAll();
		return projects.find((p) => p.id === id) || null;
	},

	// Save a project (create or update)
	save(project: Project): void {
		const projects = this.getAll();
		const existingIndex = projects.findIndex((p) => p.id === project.id);

		if (existingIndex >= 0) {
			// Update existing
			projects[existingIndex] = {
				...project,
				updatedAt: Date.now(),
			};
		} else {
			// Create new
			projects.push(project);
		}

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
		} catch (error) {
			console.error('Error saving project:', error);
		}
	},

	// Delete a project
	delete(id: string): void {
		const projects = this.getAll();
		const filtered = projects.filter((p) => p.id !== id);

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
		} catch (error) {
			console.error('Error deleting project:', error);
		}
	},

	// Delete all projects
	clear(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error('Error clearing projects:', error);
		}
	},

	// Generate thumbnail from canvas
	async generateThumbnail(canvas: HTMLCanvasElement, maxWidth = 400): Promise<string> {
		return new Promise((resolve) => {
			const scale = maxWidth / canvas.width;
			const thumbnailCanvas = document.createElement('canvas');
			thumbnailCanvas.width = maxWidth;
			thumbnailCanvas.height = canvas.height * scale;

			const ctx = thumbnailCanvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
			}

			resolve(thumbnailCanvas.toDataURL('image/jpeg', 0.7));
		});
	},
};
