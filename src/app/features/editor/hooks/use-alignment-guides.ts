import { useCallback, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

interface UseAlignmentGuidesProps {
	canvas: fabric.Canvas | null;
	snap?: boolean; // enable snapping (default true)
	threshold?: number; // pixels for show + snap threshold (default 10)
}

interface GuideLine {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	type?: 'alignment' | 'distribution' | 'spacing';
}

// Helper: mark objects we add as guides so we exclude them from calculations
const markAsGuide = (obj: fabric.Object) => {
	(obj as fabric.Object & { __isGuide?: boolean }).__isGuide = true;
	obj.selectable = false;
	obj.evented = false;
};

export const useAlignmentGuides = ({
	canvas,
	snap = true,
	threshold = 10,
}: UseAlignmentGuidesProps) => {
	const guideLinesRef = useRef<fabric.Object[]>([]);
	const rafRef = useRef<number | null>(null);

	const clearGuideLines = useCallback(() => {
		if (!canvas) return;
		guideLinesRef.current.forEach((g) => {
			try {
				canvas.remove(g);
			} catch {
				/* ignore */
			}
		});
		guideLinesRef.current = [];
	}, [canvas]);

	const getZoom = useCallback(() => canvas?.getZoom?.() ?? 1, [canvas]);

	const getObjectBounds = useCallback((obj: fabric.Object) => {
		const bounds = obj.getBoundingRect();
		const zoom = getZoom();
		return {
			left: bounds.left / zoom,
			right: (bounds.left + bounds.width) / zoom,
			top: bounds.top / zoom,
			bottom: (bounds.top + bounds.height) / zoom,
			centerX: (bounds.left + bounds.width / 2) / zoom,
			centerY: (bounds.top + bounds.height / 2) / zoom,
			width: bounds.width / zoom,
			height: bounds.height / zoom,
		};
	}, [canvas]);

	const drawGuideLine = useCallback((guide: GuideLine) => {
		if (!canvas) return;
		const zoom = getZoom();
		let strokeColor = '#007AFF';
		let strokeWidth = 2 / zoom;
		let strokeDashArray: number[] = [5 / zoom, 5 / zoom];

		if (guide.type === 'distribution') {
			strokeColor = '#FF6B35';
			strokeDashArray = [8 / zoom, 4 / zoom];
		} else if (guide.type === 'spacing') {
			strokeColor = '#00D4AA';
			strokeDashArray = [3 / zoom, 3 / zoom];
			strokeWidth = 1.5 / zoom;
		}

		const line = new fabric.Line([0, 0, 0, 0], {
			stroke: strokeColor,
			strokeWidth,
			selectable: false,
			evented: false,
			opacity: 0.95,
			strokeDashArray,
			originX: 'left',
			originY: 'top',
		});
		markAsGuide(line);

		if (typeof guide.x === 'number') {
			// full-height vertical line (positions adjusted for zoom)
			const x = guide.x * zoom;
			line.set({
				x1: x,
				y1: 0,
				x2: x,
				y2: canvas.getHeight
					? canvas.getHeight()
					: canvas.getHeight
					? canvas.getHeight()
					: 0,
			});
			// also store left for convenience
			(line as fabric.Line & { __guidePos?: { x?: number; y?: number } }).__guidePos = { x: guide.x };
		} else if (typeof guide.y === 'number') {
			const y = guide.y * zoom;
			line.set({
				x1: 0,
				y1: y,
				x2: canvas.getWidth ? canvas.getWidth() : 0,
				y2: y,
			});
			(line as fabric.Line & { __guidePos?: { x?: number; y?: number } }).__guidePos = { y: guide.y };
		}

		canvas.add(line);
		guideLinesRef.current.push(line);
	}, [canvas, getZoom]);

	const drawGuideLabel = useCallback((guide: GuideLine, label: string) => {
		if (!canvas) return;
		const zoom = getZoom();
		const text = new fabric.Text(label, {
			fontSize: 10 / zoom,
			fill:
				guide.type === 'distribution'
					? '#FF6B35'
					: guide.type === 'spacing'
					? '#00D4AA'
					: '#007AFF',
			fontFamily: 'Arial, sans-serif',
			fontWeight: 'bold',
			selectable: false,
			evented: false,
			opacity: 0.95,
			backgroundColor: 'rgba(255,255,255,0.85)',
			padding: 2 / zoom,
		});
		markAsGuide(text);

		if (typeof guide.x === 'number') {
			text.set({ left: guide.x * zoom + 6, top: 6 });
		} else if (typeof guide.y === 'number') {
			text.set({ left: 6, top: guide.y * zoom + 6 });
		}

		canvas.add(text);
		guideLinesRef.current.push(text);
	}, [canvas, getZoom]);

	const drawMeasurementGuide = useCallback((object: fabric.Object) => {
		if (!canvas) return;
		const bounds = object.getBoundingRect();
		const zoom = getZoom();

		const hLine = new fabric.Line(
			[
				bounds.left,
				bounds.top - 15,
				bounds.left + bounds.width,
				bounds.top - 15,
			],
			{
				stroke: '#FF9500',
				strokeWidth: 1.5 / zoom,
				selectable: false,
				evented: false,
				strokeDashArray: [2 / zoom, 2 / zoom],
				opacity: 0.9,
			},
		);
		markAsGuide(hLine);

		const vLine = new fabric.Line(
			[
				bounds.left + bounds.width + 15,
				bounds.top,
				bounds.left + bounds.width + 15,
				bounds.top + bounds.height,
			],
			{
				stroke: '#FF9500',
				strokeWidth: 1.5 / zoom,
				selectable: false,
				evented: false,
				strokeDashArray: [2 / zoom, 2 / zoom],
				opacity: 0.9,
			},
		);
		markAsGuide(vLine);

		const widthText = new fabric.Text(`${Math.round(bounds.width)}px`, {
			fontSize: 9 / zoom,
			fill: '#FF9500',
			selectable: false,
			evented: false,
			opacity: 0.95,
			backgroundColor: 'rgba(255,255,255,0.9)',
			left: bounds.left + bounds.width / 2 - 20,
			top: bounds.top - 25,
		});
		markAsGuide(widthText);

		const heightText = new fabric.Text(`${Math.round(bounds.height)}px`, {
			fontSize: 9 / zoom,
			fill: '#FF9500',
			selectable: false,
			evented: false,
			opacity: 0.95,
			backgroundColor: 'rgba(255,255,255,0.9)',
			left: bounds.left + bounds.width + 5,
			top: bounds.top + bounds.height / 2 - 8,
			angle: 90,
		});
		markAsGuide(heightText);

		canvas.add(hLine, vLine, widthText, heightText);
		guideLinesRef.current.push(hLine, vLine, widthText, heightText);
	}, [canvas, getZoom]);

	const getNonGuideObjects = useCallback(() => {
		if (!canvas) return [];
		return canvas.getObjects().filter((o) => !(o as fabric.Object & { __isGuide?: boolean }).__isGuide);
	}, [canvas]);

	const computeGuides = useCallback((activeObject: fabric.Object) => {
		if (!canvas) return { guides: [] as GuideLine[] };

		const activeBounds = getObjectBounds(activeObject);
		const objects = getNonGuideObjects().filter((obj) => obj !== activeObject);

		const guides: GuideLine[] = [];
		const TH = threshold;

		// Alignment with other objects
		objects.forEach((obj) => {
			const b = getObjectBounds(obj);

			const horizontalPairs = [
				{ active: activeBounds.left, target: b.left },
				{ active: activeBounds.right, target: b.right },
				{ active: activeBounds.centerX, target: b.centerX },
				{ active: activeBounds.left, target: b.right },
				{ active: activeBounds.right, target: b.left },
			];
			horizontalPairs.forEach(({ active, target }) => {
				if (Math.abs(active - target) <= TH)
					guides.push({ x: target, type: 'alignment' });
			});

			const verticalPairs = [
				{ active: activeBounds.top, target: b.top },
				{ active: activeBounds.bottom, target: b.bottom },
				{ active: activeBounds.centerY, target: b.centerY },
				{ active: activeBounds.top, target: b.bottom },
				{ active: activeBounds.bottom, target: b.top },
			];
			verticalPairs.forEach(({ active, target }) => {
				if (Math.abs(active - target) <= TH)
					guides.push({ y: target, type: 'alignment' });
			});
		});

		// Canvas edges & center
		const canvasWidth =
			(canvas.getWidth ? canvas.getWidth() : canvas.width || 0) / getZoom();
		const canvasHeight =
			(canvas.getHeight ? canvas.getHeight() : canvas.height || 0) / getZoom();
		const canvasCenterX = canvasWidth / 2;
		const canvasCenterY = canvasHeight / 2;

		const canvasChecksX = [
			{ active: activeBounds.left, target: 0 },
			{ active: activeBounds.right, target: canvasWidth },
			{ active: activeBounds.centerX, target: canvasCenterX },
		];
		canvasChecksX.forEach(({ active, target }) => {
			if (Math.abs(active - target) <= threshold)
				guides.push({ x: target, type: 'alignment' });
		});

		const canvasChecksY = [
			{ active: activeBounds.top, target: 0 },
			{ active: activeBounds.bottom, target: canvasHeight },
			{ active: activeBounds.centerY, target: canvasCenterY },
		];
		canvasChecksY.forEach(({ active, target }) => {
			if (Math.abs(active - target) <= threshold)
				guides.push({ y: target, type: 'alignment' });
		});

		// Distribution & spacing (lightweight)
		if (objects.length >= 2) {
			const sortedX = [...objects, activeObject].sort(
				(a, b) => getObjectBounds(a).left - getObjectBounds(b).left,
			);
			const sortedY = [...objects, activeObject].sort(
				(a, b) => getObjectBounds(a).top - getObjectBounds(b).top,
			);

			// horizontal distribution check
			for (let i = 1; i < sortedX.length - 1; i++) {
				const prev = getObjectBounds(sortedX[i - 1]);
				const curr = getObjectBounds(sortedX[i]);
				const next = getObjectBounds(sortedX[i + 1]);
				const ideal = (prev.centerX + next.centerX) / 2;
				if (Math.abs(curr.centerX - ideal) <= threshold)
					guides.push({ x: ideal, type: 'distribution' });
			}

			// vertical distribution check
			for (let i = 1; i < sortedY.length - 1; i++) {
				const prev = getObjectBounds(sortedY[i - 1]);
				const curr = getObjectBounds(sortedY[i]);
				const next = getObjectBounds(sortedY[i + 1]);
				const ideal = (prev.centerY + next.centerY) / 2;
				if (Math.abs(curr.centerY - ideal) <= threshold)
					guides.push({ y: ideal, type: 'distribution' });
			}
		}

		// remove duplicates
		const unique = guides.filter(
			(g, idx, arr) =>
				idx ===
				arr.findIndex((a) => a.x === g.x && a.y === g.y && a.type === g.type),
		);
		return { guides: unique };
	}, [canvas, threshold, getObjectBounds, getNonGuideObjects, getZoom]);

	const applySnapping = useCallback((activeObject: fabric.Object, guides: GuideLine[]) => {
		if (!canvas || !snap) return;
		const bounds = getObjectBounds(activeObject);
		let snapped = false;

		// Try snap X
		const xGuides = guides.filter((g) => typeof g.x === 'number');
		for (const g of xGuides) {
			const gx = g.x as number;
			// decide what to snap: left, right or center depending on closeness
			const candidates = [
				{ prop: 'left', value: bounds.left },
				{ prop: 'right', value: bounds.right },
				{ prop: 'centerX', value: bounds.centerX },
			] as const;

			for (const c of candidates) {
				if (Math.abs(c.value - gx) <= threshold) {
					// compute new left in fabric coordinate space (account for zoom)
					const dx = gx - c.value; // desired delta in unzoomed coords
					// move object by delta
					activeObject.left = (activeObject.left || 0) + dx;
					snapped = true;
					break;
				}
			}
			if (snapped) break;
		}

		// Try snap Y
		const yGuides = guides.filter((g) => typeof g.y === 'number');
		snapped = false;
		for (const g of yGuides) {
			const gy = g.y as number;
			const candidates = [
				{ prop: 'top', value: bounds.top },
				{ prop: 'bottom', value: bounds.bottom },
				{ prop: 'centerY', value: bounds.centerY },
			] as const;

			for (const c of candidates) {
				if (Math.abs(c.value - gy) <= threshold) {
					const dy = gy - c.value;
					activeObject.top = (activeObject.top || 0) + dy;
					snapped = true;
					break;
				}
			}
			if (snapped) break;
		}

		activeObject.setCoords();
	}, [canvas, snap, threshold, getObjectBounds, getZoom]);

	useEffect(() => {
		if (!canvas) return;

		const handle = (e: fabric.TEvent<Event>, kind: 'moving' | 'scaling') => {
			const activeObject = (e as fabric.TEvent & { target?: fabric.Object }).target;
			if (!activeObject) return;

			// cancel previous scheduled frame
			if (rafRef.current) cancelAnimationFrame(rafRef.current);

			rafRef.current = requestAnimationFrame(() => {
				clearGuideLines();

				const { guides } = computeGuides(activeObject);
				// apply snapping BEFORE drawing guides so object snaps into final place
				applySnapping(activeObject, guides);

				// draw guides and labels
				guides.forEach((guide) => {
					drawGuideLine(guide);
					const label =
						guide.type === 'distribution'
							? 'DISTRIBUTE'
							: guide.type === 'spacing'
							? 'SPACING'
							: 'ALIGN';
					drawGuideLabel(guide, label);
				});

				if (kind === 'scaling') {
					drawMeasurementGuide(activeObject);
				}

				canvas.requestRenderAll();
			});
		};

		const onObjectMoving = (e: fabric.TEvent<Event>) => handle(e, 'moving');
		const onObjectScaling = (e: fabric.TEvent<Event>) => handle(e, 'scaling');
		const onModifiedOrCleared = () => clearGuideLines();

		canvas.on('object:moving', onObjectMoving);
		canvas.on('object:scaling', onObjectScaling);
		canvas.on('object:modified', onModifiedOrCleared);
		canvas.on('selection:cleared', onModifiedOrCleared);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			canvas.off('object:moving', onObjectMoving);
			canvas.off('object:scaling', onObjectScaling);
			canvas.off('object:modified', onModifiedOrCleared);
			canvas.off('selection:cleared', onModifiedOrCleared);
			clearGuideLines();
		};
	}, [canvas, snap, threshold, applySnapping, clearGuideLines, computeGuides, drawGuideLabel, drawGuideLine, drawMeasurementGuide]);

	// cleanup if canvas instance changes externally
	useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			clearGuideLines();
		};
	}, [clearGuideLines]);
};
