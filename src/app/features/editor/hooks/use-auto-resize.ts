import * as fabric from 'fabric';
import { useCallback, useEffect } from 'react';

interface UseAutoResizeProps {
	canvas: fabric.Canvas | null;
	container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
	const autoZoom = useCallback(async () => {
		if (!canvas || !container) return;

		const width = container.offsetWidth;
		const height = container.offsetHeight;

		canvas.setWidth(width);
		canvas.setHeight(height);

		const center = canvas.getCenter();

		const zoomRatio = 0.85;
		const objects = canvas.getObjects();
		const localWorkspace = objects.find(
			(object) => (object as fabric.FabricObject & { name?: string }).name === 'clip'
		) || (objects[0] && objects[0].type === 'Rect' ? objects[0] : undefined);

		if (!localWorkspace) return;

		const scale = fabric.util.findScaleToFit(localWorkspace, {
			width: width,
			height: height,
		});

		const zoom = zoomRatio * scale;

		canvas.setViewportTransform(fabric.iMatrix);
		canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

		const workspaceCenter = localWorkspace.getCenterPoint();
		const viewportTransform = canvas.viewportTransform;

		if (
			canvas.width === undefined ||
			canvas.height === undefined ||
			!viewportTransform
		) {
			return;
		}

		// eslint-disable-next-line
		viewportTransform[4] =
			canvas.width / 2 - workspaceCenter.x * viewportTransform[0];

		viewportTransform[5] =
			canvas.height / 2 - workspaceCenter.y * viewportTransform[3];

		canvas.setViewportTransform(viewportTransform);

		const cloned = await localWorkspace.clone();
		// Set canvas clip path so objects going outside the main workspace are hidden
		// eslint-disable-next-line
		canvas.clipPath = cloned;
		
		localWorkspace.set({
			evented: false,
		});
		canvas.requestRenderAll();
	}, [canvas, container]);

	useEffect(() => {
		let resizeObserver: ResizeObserver | null = null;

		if (canvas && container) {
			resizeObserver = new ResizeObserver(() => {
				autoZoom();
			});

			resizeObserver.observe(container);
		}

		return () => {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	}, [canvas, container, autoZoom]);

	return { autoZoom };
};
