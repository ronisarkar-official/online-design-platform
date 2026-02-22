import * as fabric from 'fabric';
import { useEffect } from 'react';
interface UseCanvasEventsProps {
	canvas: fabric.Canvas | null;
	setSelectedObjects: (objects: fabric.Object[]) => void;
	save: () => void;
}

export const useCanvasEvents = ({
	canvas,
	setSelectedObjects,
	save,
}: UseCanvasEventsProps) => {
	useEffect(() => {
		if (canvas) {
			canvas.on('selection:created', (event) => {
				setSelectedObjects(event.selected);
			});
			canvas.on('selection:updated', (event) => {
				setSelectedObjects(event.selected);
			});
			canvas.on('selection:cleared', () => {
				setSelectedObjects([]);
			});
			canvas.on('object:modified', () => {
				// Update selectedObjects when objects are modified to trigger re-renders
				setSelectedObjects(canvas.getActiveObjects());
				save(); // Ensure any modification hits the undo stack
			});
			canvas.on('object:added', () => {
				save(); // A stroke was drawn or shape added; snapshot
			});
			canvas.on('object:removed', () => {
				save(); // Shape deleted; snapshot
			});
		}
		return () => {
			if (canvas) {
				canvas.off('selection:created');
				canvas.off('selection:updated');
				canvas.off('selection:cleared');
				canvas.off('object:modified');
				canvas.off('object:added');
				canvas.off('object:removed');
			}
		};
	}, [canvas, setSelectedObjects, save]);
};
