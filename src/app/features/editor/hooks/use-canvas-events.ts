import * as fabric from 'fabric';
import { useEffect } from 'react';
interface UseCanvasEventsProps {
	canvas: fabric.Canvas | null;
	setSelectedObjects: (objects: fabric.Object[]) => void;
}

export const useCanvasEvents = ({
	canvas,
	setSelectedObjects,
}: UseCanvasEventsProps) => {
	useEffect(() => {
		if (canvas) {
			canvas.on("selection:created", (event) => {
				setSelectedObjects(event.selected);
            });
            canvas.on("selection:updated", (event) => {
                setSelectedObjects(event.selected);
            });
            canvas.on("selection:cleared", () => {
                setSelectedObjects([]);
            });
            canvas.on("object:modified", () => {
                // Update selectedObjects when objects are modified to trigger re-renders
                setSelectedObjects(canvas.getActiveObjects());
            });
        }
        return () => {
            if (canvas) {
                canvas.off("selection:created");
                canvas.off("selection:updated");
                canvas.off("selection:cleared");
                canvas.off("object:modified");
            }
        };
    }, [canvas,
        setSelectedObjects
    ]);
};
