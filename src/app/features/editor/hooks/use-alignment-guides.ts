import { useCallback, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseAlignmentGuidesProps {
	canvas: fabric.Canvas | null;
	/** Enable snapping (default true) */
	snap?: boolean;
	/** Pixel threshold in object-space pixels (default 5) */
	threshold?: number;
}

interface SnapLine {
	orientation: 'vertical' | 'horizontal';
	/** Position in OBJECT-SPACE (unzoomed) coordinates */
	position: number;
	/** Start of line in OBJECT-SPACE (perpendicular axis) */
	start: number;
	/** End of line in OBJECT-SPACE (perpendicular axis) */
	end: number;
	type: 'alignment' | 'distribution';
}

interface SnapResult {
	dx: number; // delta in object-space
	dy: number; // delta in object-space
	lines: SnapLine[];
}

interface ObjBounds {
	left: number;
	right: number;
	top: number;
	bottom: number;
	cx: number;
	cy: number;
	w: number;
	h: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GUIDE_COLOR = '#ff2ecb';
const DIST_COLOR = '#ff6b35';
const LINE_W = 1;
const DASH: number[] = [5, 4];
const MARKER = 4;

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useAlignmentGuides = ({
	canvas,
	snap = true,
	threshold = 5,
}: UseAlignmentGuidesProps) => {
	const linesRef = useRef<SnapLine[]>([]);
	const rafRef = useRef<number | null>(null);

	// ── Helpers ─────────────────────────────────────────────────────────────

	const getWorkspace = useCallback((): fabric.Object | undefined => {
		if (!canvas) return undefined;
		return canvas
			.getObjects()
			.find((o) => (o as fabric.FabricObject & { name?: string }).name === 'clip');
	}, [canvas]);

	const getTargets = useCallback(
		(exclude: fabric.Object): fabric.Object[] => {
			if (!canvas) return [];
			return canvas.getObjects().filter((o) => {
				if (o === exclude) return false;
				if ((o as fabric.FabricObject & { name?: string }).name === 'clip') return false;
				// skip non-interactive objects (guide lines etc.)
				if (!o.selectable && !o.evented) return false;
				return true;
			});
		},
		[canvas],
	);

	/**
	 * Get bounds in OBJECT-SPACE (unzoomed, un-panned).
	 * We use aCoords which gives the actual corner points in canvas object space.
	 */
	const getBounds = useCallback((obj: fabric.Object): ObjBounds => {
		// getBoundingRect returns viewport-space (zoomed+panned).
		// We need object-space. We can get it by dividing by zoom and subtracting pan.
		if (!canvas) {
			const br = obj.getBoundingRect();
			return {
				left: br.left, right: br.left + br.width,
				top: br.top, bottom: br.top + br.height,
				cx: br.left + br.width / 2, cy: br.top + br.height / 2,
				w: br.width, h: br.height,
			};
		}
		const zoom = canvas.getZoom();
		const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
		const br = obj.getBoundingRect(); // viewport-space
		// Convert to object-space: subtract pan then divide by zoom
		const left = (br.left - vpt[4]) / zoom;
		const top = (br.top - vpt[5]) / zoom;
		const w = br.width / zoom;
		const h = br.height / zoom;
		return {
			left,
			right: left + w,
			top,
			bottom: top + h,
			cx: left + w / 2,
			cy: top + h / 2,
			w,
			h,
		};
	}, [canvas]);

	// ── Core snap computation (all in object-space) ──────────────────────────

	const computeSnap = useCallback(
		(active: fabric.Object): SnapResult => {
			if (!canvas) return { dx: 0, dy: 0, lines: [] };

			const ab = getBounds(active);
			const targets = getTargets(active);
			const workspace = getWorkspace();
			const TH = threshold; // object-space threshold

			let bestDx = Infinity;
			let bestDy = Infinity;
			const lines: SnapLine[] = [];

			// ── Reference points ─────────────────────────────────────────────

			interface Ref {
				pos: number;
				spanStart: number;
				spanEnd: number;
			}

			const xRefs: Ref[] = []; // vertical guide positions (x-axis)
			const yRefs: Ref[] = []; // horizontal guide positions (y-axis)

			// Workspace references
			if (workspace) {
				const wb = getBounds(workspace);

				// Edges
				xRefs.push(
					{ pos: wb.left, spanStart: wb.top, spanEnd: wb.bottom },
					{ pos: wb.right, spanStart: wb.top, spanEnd: wb.bottom },
				);
				yRefs.push(
					{ pos: wb.top, spanStart: wb.left, spanEnd: wb.right },
					{ pos: wb.bottom, spanStart: wb.left, spanEnd: wb.right },
				);

				// Center
				xRefs.push({ pos: wb.cx, spanStart: wb.top, spanEnd: wb.bottom });
				yRefs.push({ pos: wb.cy, spanStart: wb.left, spanEnd: wb.right });

				// Thirds
				xRefs.push(
					{ pos: wb.left + wb.w / 3, spanStart: wb.top, spanEnd: wb.bottom },
					{ pos: wb.left + (wb.w * 2) / 3, spanStart: wb.top, spanEnd: wb.bottom },
				);
				yRefs.push(
					{ pos: wb.top + wb.h / 3, spanStart: wb.left, spanEnd: wb.right },
					{ pos: wb.top + (wb.h * 2) / 3, spanStart: wb.left, spanEnd: wb.right },
				);

				// Quarters
				xRefs.push(
					{ pos: wb.left + wb.w / 4, spanStart: wb.top, spanEnd: wb.bottom },
					{ pos: wb.left + (wb.w * 3) / 4, spanStart: wb.top, spanEnd: wb.bottom },
				);
				yRefs.push(
					{ pos: wb.top + wb.h / 4, spanStart: wb.left, spanEnd: wb.right },
					{ pos: wb.top + (wb.h * 3) / 4, spanStart: wb.left, spanEnd: wb.right },
				);
			}

			// Object references
			for (const t of targets) {
				const tb = getBounds(t);
				xRefs.push(
					{ pos: tb.left, spanStart: tb.top, spanEnd: tb.bottom },
					{ pos: tb.right, spanStart: tb.top, spanEnd: tb.bottom },
					{ pos: tb.cx, spanStart: tb.top, spanEnd: tb.bottom },
				);
				yRefs.push(
					{ pos: tb.top, spanStart: tb.left, spanEnd: tb.right },
					{ pos: tb.bottom, spanStart: tb.left, spanEnd: tb.right },
					{ pos: tb.cy, spanStart: tb.left, spanEnd: tb.right },
				);
			}

			// ── Active object snap edges ──────────────────────────────────────

			const aEdgesX = [ab.left, ab.cx, ab.right];
			const aEdgesY = [ab.top, ab.cy, ab.bottom];

			// Check vertical guides (X snap)
			for (const ref of xRefs) {
				for (const edge of aEdgesX) {
					const diff = ref.pos - edge;
					if (Math.abs(diff) <= TH) {
						if (Math.abs(diff) < Math.abs(bestDx)) bestDx = diff;
						lines.push({
							orientation: 'vertical',
							position: ref.pos,
							start: Math.min(ref.spanStart, ab.top),
							end: Math.max(ref.spanEnd, ab.bottom),
							type: 'alignment',
						});
					}
				}
			}

			// Check horizontal guides (Y snap)
			for (const ref of yRefs) {
				for (const edge of aEdgesY) {
					const diff = ref.pos - edge;
					if (Math.abs(diff) <= TH) {
						if (Math.abs(diff) < Math.abs(bestDy)) bestDy = diff;
						lines.push({
							orientation: 'horizontal',
							position: ref.pos,
							start: Math.min(ref.spanStart, ab.left),
							end: Math.max(ref.spanEnd, ab.right),
							type: 'alignment',
						});
					}
				}
			}

			// ── Equal spacing / distribution ──────────────────────────────────

			if (targets.length >= 2) {
				const all = [...targets, active];

				// Horizontal equal spacing
				const byX = all
					.map((o) => ({ o, b: getBounds(o) }))
					.sort((a, b) => a.b.left - b.b.left);

				for (let i = 1; i < byX.length - 1; i++) {
					const prev = byX[i - 1].b;
					const curr = byX[i].b;
					const next = byX[i + 1].b;
					const gL = curr.left - prev.right;
					const gR = next.left - curr.right;
					if (gL > 0 && gR > 0 && Math.abs(gL - gR) <= TH) {
						// Show gap indicator lines (horizontal lines spanning the gap)
						const y = Math.min(prev.cy, curr.cy, next.cy) - 15;
						lines.push(
							{ orientation: 'horizontal', position: y, start: prev.right, end: curr.left, type: 'distribution' },
							{ orientation: 'horizontal', position: y, start: curr.right, end: next.left, type: 'distribution' },
						);
						if (byX[i].o === active) {
							const ideal = prev.right + gL;
							const dxIdeal = ideal - curr.left;
							if (Math.abs(dxIdeal) < Math.abs(bestDx) || !isFinite(bestDx)) bestDx = dxIdeal;
						}
					}
				}

				// Vertical equal spacing
				const byY = all
					.map((o) => ({ o, b: getBounds(o) }))
					.sort((a, b) => a.b.top - b.b.top);

				for (let i = 1; i < byY.length - 1; i++) {
					const prev = byY[i - 1].b;
					const curr = byY[i].b;
					const next = byY[i + 1].b;
					const gT = curr.top - prev.bottom;
					const gB = next.top - curr.bottom;
					if (gT > 0 && gB > 0 && Math.abs(gT - gB) <= TH) {
						const x = Math.min(prev.cx, curr.cx, next.cx) - 15;
						lines.push(
							{ orientation: 'vertical', position: x, start: prev.bottom, end: curr.top, type: 'distribution' },
							{ orientation: 'vertical', position: x, start: curr.bottom, end: next.top, type: 'distribution' },
						);
						if (byY[i].o === active) {
							const ideal = prev.bottom + gT;
							const dyIdeal = ideal - curr.top;
							if (Math.abs(dyIdeal) < Math.abs(bestDy) || !isFinite(bestDy)) bestDy = dyIdeal;
						}
					}
				}
			}

			// Deduplicate
			const unique = lines.filter(
				(l, i, arr) =>
					i === arr.findIndex(
						(x) => x.orientation === l.orientation && Math.abs(x.position - l.position) < 0.5 && x.type === l.type,
					),
			);

			return {
				dx: isFinite(bestDx) && snap ? bestDx : 0,
				dy: isFinite(bestDy) && snap ? bestDy : 0,
				lines: unique,
			};
		},
		[canvas, threshold, snap, getBounds, getTargets, getWorkspace],
	);

	// ── Render overlay ───────────────────────────────────────────────────────

	const renderOverlay = useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const lines = linesRef.current;
			if (!lines.length || !canvas) return;

			const zoom = canvas.getZoom();
			const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

			// Helper: convert object-space coordinate to viewport-space
			const toVP = (v: number, pan: number) => v * zoom + pan;

			// Get workspace bounds in viewport-space for clipping
			const ws = getWorkspace();
			ctx.save();

			if (ws) {
				const wb = ws.getBoundingRect(); // already viewport-space
				ctx.beginPath();
				ctx.rect(wb.left, wb.top, wb.width, wb.height);
				ctx.clip();
			}

			for (const line of lines) {
				const color = line.type === 'distribution' ? DIST_COLOR : GUIDE_COLOR;
				ctx.strokeStyle = color;
				ctx.fillStyle = color;
				ctx.lineWidth = LINE_W;
				ctx.setLineDash(DASH);
				ctx.globalAlpha = 0.95;

				ctx.beginPath();
				if (line.orientation === 'vertical') {
					// position = x, start/end = y range
					const x = toVP(line.position, vpt[4]);
					const y1 = toVP(line.start, vpt[5]);
					const y2 = toVP(line.end, vpt[5]);
					ctx.moveTo(x, y1);
					ctx.lineTo(x, y2);
					ctx.stroke();
					ctx.setLineDash([]);
					drawDiamond(ctx, x, y1);
					drawDiamond(ctx, x, y2);
				} else {
					// position = y, start/end = x range
					const y = toVP(line.position, vpt[5]);
					const x1 = toVP(line.start, vpt[4]);
					const x2 = toVP(line.end, vpt[4]);
					ctx.moveTo(x1, y);
					ctx.lineTo(x2, y);
					ctx.stroke();
					ctx.setLineDash([]);
					drawDiamond(ctx, x1, y);
					drawDiamond(ctx, x2, y);
				}

				// Distance label for distribution guides
				if (line.type === 'distribution') {
					const distObj = Math.abs(line.end - line.start);
					const distVP = distObj * zoom;
					if (distVP > 20) {
						ctx.setLineDash([]);
						ctx.font = `${Math.round(11 / zoom)}px Inter, Arial, sans-serif`;
						ctx.globalAlpha = 1;
						const label = `${Math.round(distObj)}`;
						const tw = ctx.measureText(label).width;
						if (line.orientation === 'horizontal') {
							const mx = toVP((line.start + line.end) / 2, vpt[4]);
							const ly = toVP(line.position, vpt[5]);
							ctx.fillStyle = 'rgba(255,255,255,0.92)';
							ctx.fillRect(mx - tw / 2 - 3, ly - 16, tw + 6, 14);
							ctx.fillStyle = color;
							ctx.fillText(label, mx - tw / 2, ly - 5);
						} else {
							const my = toVP((line.start + line.end) / 2, vpt[5]);
							const lx = toVP(line.position, vpt[4]);
							ctx.fillStyle = 'rgba(255,255,255,0.92)';
							ctx.fillRect(lx + 5, my - 7, tw + 6, 14);
							ctx.fillStyle = color;
							ctx.fillText(label, lx + 8, my + 4);
						}
					}
				}
			}

			ctx.restore();
		},
		[canvas, getWorkspace],
	);

	// ── Event wiring ─────────────────────────────────────────────────────────

	useEffect(() => {
		if (!canvas) return;

		const onMoving = (e: fabric.TEvent<Event>) => {
			const target = (e as fabric.TEvent & { target?: fabric.Object }).target;
			if (!target) return;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const { dx, dy, lines } = computeSnap(target);
				// dx/dy are in object-space — apply directly to object.left/top
				if (dx !== 0) target.left = (target.left ?? 0) + dx;
				if (dy !== 0) target.top = (target.top ?? 0) + dy;
				if (dx !== 0 || dy !== 0) target.setCoords();
				linesRef.current = lines;
				canvas.requestRenderAll();
			});
		};

		const onScaling = (e: fabric.TEvent<Event>) => {
			const target = (e as fabric.TEvent & { target?: fabric.Object }).target;
			if (!target) return;
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const { lines } = computeSnap(target);
				linesRef.current = lines;
				canvas.requestRenderAll();
			});
		};

		const onClear = () => {
			linesRef.current = [];
			canvas.requestRenderAll();
		};

		const afterRender = (opt: { ctx: CanvasRenderingContext2D }) => {
			renderOverlay(opt.ctx);
		};

		canvas.on('object:moving', onMoving);
		canvas.on('object:scaling', onScaling);
		canvas.on('object:modified', onClear);
		canvas.on('selection:cleared', onClear);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		canvas.on('after:render' as any, afterRender);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			canvas.off('object:moving', onMoving);
			canvas.off('object:scaling', onScaling);
			canvas.off('object:modified', onClear);
			canvas.off('selection:cleared', onClear);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			canvas.off('after:render' as any, afterRender);
			linesRef.current = [];
		};
	}, [canvas, computeSnap, renderOverlay]);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number) {
	ctx.beginPath();
	ctx.moveTo(x, y - MARKER);
	ctx.lineTo(x + MARKER, y);
	ctx.lineTo(x, y + MARKER);
	ctx.lineTo(x - MARKER, y);
	ctx.closePath();
	ctx.fill();
}
