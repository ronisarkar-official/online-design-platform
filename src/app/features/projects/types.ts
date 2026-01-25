export interface Project {
	id: string;
	name: string;
	width: number;
	height: number;
	thumbnailData?: string;
	canvasData?: string;
	createdAt: number;
	updatedAt: number;
}

export interface ProjectTemplate {
	id: string;
	name: string;
	description: string;
	width: number;
	height: number;
	category: 'social' | 'print' | 'custom';
	icon?: string;
}

export const TEMPLATES: ProjectTemplate[] = [
	// Instagram
	{
		id: 'instagram-post',
		name: 'Instagram Post',
		description: '1080 x 1080px',
		width: 1080,
		height: 1080,
		category: 'social',
	},
	{
		id: 'instagram-story',
		name: 'Instagram Story',
		description: '1080 x 1920px',
		width: 1080,
		height: 1920,
		category: 'social',
	},
	// Facebook
	{
		id: 'facebook-post',
		name: 'Facebook Post',
		description: '1200 x 630px',
		width: 1200,
		height: 630,
		category: 'social',
	},
	{
		id: 'facebook-cover',
		name: 'Facebook Cover',
		description: '820 x 312px',
		width: 820,
		height: 312,
		category: 'social',
	},
	// Twitter/X
	{
		id: 'twitter-post',
		name: 'Twitter Post',
		description: '1200 x 675px',
		width: 1200,
		height: 675,
		category: 'social',
	},
	{
		id: 'twitter-header',
		name: 'Twitter Header',
		description: '1500 x 500px',
		width: 1500,
		height: 500,
		category: 'social',
	},
	// LinkedIn
	{
		id: 'linkedin-post',
		name: 'LinkedIn Post',
		description: '1200 x 627px',
		width: 1200,
		height: 627,
		category: 'social',
	},
	// YouTube
	{
		id: 'youtube-thumbnail',
		name: 'YouTube Thumbnail',
		description: '1280 x 720px',
		width: 1280,
		height: 720,
		category: 'social',
	},
	// Print
	{
		id: 'a4-portrait',
		name: 'A4 Portrait',
		description: '2480 x 3508px',
		width: 2480,
		height: 3508,
		category: 'print',
	},
	{
		id: 'a4-landscape',
		name: 'A4 Landscape',
		description: '3508 x 2480px',
		width: 3508,
		height: 2480,
		category: 'print',
	},
	// Custom
	{
		id: 'custom',
		name: 'Custom Size',
		description: 'Define your own dimensions',
		width: 1920,
		height: 1080,
		category: 'custom',
	},
];
