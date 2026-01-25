import { v4 as uuid } from 'uuid';
import * as fabric from 'fabric';
import type { RGBColor } from 'react-color';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformText(objects: any) {
	if (!objects) return;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	objects.forEach((item: any) => {
		if (item.objects) {
			transformText(item.objects);
		}
		// Additional text transformation logic can be added here if needed
	});
}

export function downloadFile(file: string, type: string) {
	const anchorElement = document.createElement('a');

	anchorElement.href = file;
	anchorElement.download = `${uuid()}.${type}`;
	document.body.appendChild(anchorElement);
	anchorElement.click();
	anchorElement.remove();
}

export function isTextType(type: string | undefined) {
	return type === 'text' || type === 'i-text' || type === 'textbox';
}

export function rgbaObjectToString(rgba: RGBColor | 'transparent') {
	if (rgba === 'transparent') {
		return `rgba(0,0,0,0)`;
	}

	const alpha = rgba.a === undefined ? 1 : rgba.a;

	return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}

export const createFilter = (value: string) => {
	let effect;

	switch (value) {
		case 'greyscale':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Grayscale();
			break;
		case 'polaroid':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Polaroid();
			break;
		case 'sepia':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Sepia();
			break;
		case 'kodachrome':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Kodachrome();
			break;
		case 'contrast':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Contrast({ contrast: 0.3 });
			break;
		case 'brightness':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Brightness({ brightness: 0.8 });
			break;
		case 'brownie':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Brownie();
			break;
		case 'vintage':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Vintage();
			break;
		case 'technicolor':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Technicolor();
			break;
		case 'pixelate':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Pixelate();
			break;
		case 'invert':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Invert();
			break;
		case 'blur':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Blur();
			break;
		case 'sharpen':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Convolute({
				matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
			});
			break;
		case 'emboss':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Convolute({
				matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
			});
			break;
		case 'removecolor':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.RemoveColor({
				threshold: 0.2,
				distance: 0.5,
			});
			break;
		case 'blacknwhite':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.BlackWhite();
			break;
		case 'vibrance':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Vibrance({
				vibrance: 1,
			});
			break;
		case 'blendcolor':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.BlendColor({
				color: '#00ff00',
				mode: 'multiply',
			});
			break;
		case 'huerotate':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.HueRotation({
				rotation: 0.5,
			});
			break;
		case 'resize':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Resize();
			break;
		case 'gamma':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Gamma({
				gamma: [1, 0.5, 2.1],
			});
			break;
		case 'saturation':
			// @ts-expect-error - Fabric.js type definitions are incomplete
			effect = new fabric.filters.Saturation({
				saturation: 0.7,
			});
			break;
		default:
			effect = null;
			return;
	}

	return effect;
};

// Create a star shape with specified points
export function createStarPoints(
	points: number,
	outerRadius: number,
	innerRadius: number,
): { x: number; y: number }[] {
	const starPoints: { x: number; y: number }[] = [];
	const step = Math.PI / points;

	for (let i = 0; i < 2 * points; i++) {
		const radius = i % 2 === 0 ? outerRadius : innerRadius;
		const angle = i * step - Math.PI / 2;
		starPoints.push({
			x: outerRadius + radius * Math.cos(angle),
			y: outerRadius + radius * Math.sin(angle),
		});
	}

	return starPoints;
}

// Create a heart shape path
export function createHeartPoints(width: number, height: number): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const steps = 100;

	for (let i = 0; i <= steps; i++) {
		const t = (i / steps) * 2 * Math.PI;
		const x = width * (16 * Math.pow(Math.sin(t), 3));
		const y =
			-height *
			(13 * Math.cos(t) -
				5 * Math.cos(2 * t) -
				2 * Math.cos(3 * t) -
				Math.cos(4 * t));

		points.push({
			x: x / 16 + width / 2,
			y: y / 16 + height / 3,
		});
	}

	return points;
}

// Create an arrow shape path
export function createArrowPoints(
	width: number,
	height: number,
	headSize: number = 0.3,
): { x: number; y: number }[] {
	const shaftHeight = height * (1 - headSize);
	const shaftWidth = width * 0.3;
	const headWidth = width;

	return [
		{ x: width / 2 - shaftWidth / 2, y: 0 },
		{ x: width / 2 + shaftWidth / 2, y: 0 },
		{ x: width / 2 + shaftWidth / 2, y: shaftHeight },
		{ x: headWidth, y: shaftHeight },
		{ x: width / 2, y: height },
		{ x: 0, y: shaftHeight },
		{ x: width / 2 - shaftWidth / 2, y: shaftHeight },
	];
}

// Create a pentagon shape path
export function createPentagonPoints(size: number): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const centerX = size / 2;
	const centerY = size / 2;
	const radius = size / 2;

	for (let i = 0; i < 5; i++) {
		const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
		points.push({
			x: centerX + radius * Math.cos(angle),
			y: centerY + radius * Math.sin(angle),
		});
	}

	return points;
}

// Create a hexagon shape path
export function createHexagonPoints(size: number): { x: number; y: number }[] {
	const points: { x: number; y: number }[] = [];
	const centerX = size / 2;
	const centerY = size / 2;
	const radius = size / 2;

	for (let i = 0; i < 6; i++) {
		const angle = (i * 2 * Math.PI) / 6;
		points.push({
			x: centerX + radius * Math.cos(angle),
			y: centerY + radius * Math.sin(angle),
		});
	}

	return points;
}

// Create a gradient for fabric.js
export function createGradient(
	canvas: fabric.Canvas,
	colors: string[],
	angle: number,
	type: 'linear' | 'radial',
	width: number,
	height: number,
) {
	if (type === 'linear') {
		const angleRad = (angle * Math.PI) / 180;
		const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
		const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
		const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
		const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;

		const gradient = new fabric.Gradient({
			type: 'linear',
			coords: {
				x1,
				y1,
				x2,
				y2,
			},
			colorStops: colors.map((color, index) => ({
				offset: index / (colors.length - 1),
				color,
			})),
		});

		return gradient;
	} else {
		const gradient = new fabric.Gradient({
			type: 'radial',
			coords: {
				x1: width / 2,
				y1: height / 2,
				r1: 0,
				x2: width / 2,
				y2: height / 2,
				r2: Math.max(width, height) / 2,
			},
			colorStops: colors.map((color, index) => ({
				offset: index / (colors.length - 1),
				color,
			})),
		});

		return gradient;
	}
}

