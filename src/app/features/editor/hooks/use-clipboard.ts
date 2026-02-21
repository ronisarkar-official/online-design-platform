import * as fabric from 'fabric';
import { useCallback, useRef, useState } from 'react';

interface UseClipboardProps {
  canvas: fabric.Canvas | null;
};

export const useClipboard = ({
  canvas
}: UseClipboardProps) => {
  const clipboard = useRef<fabric.Object | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(async () => {
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      try {
        const cloned = await activeObject.clone();
        clipboard.current = cloned;
        setHasCopied(true);
      } catch (error) {
        console.error('Failed to clone object:', error);
      }
    }
  }, [canvas]);
  
  const paste = useCallback(async () => {
    if (!clipboard.current || !canvas) return;

    try {
      const clonedObj = await clipboard.current.clone();
      canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });

      if (clonedObj.type === "activeSelection") {
        const activeSelection = clonedObj as fabric.ActiveSelection;
        activeSelection.canvas = canvas;
        activeSelection.forEachObject((obj: fabric.Object) => {
          canvas.add(obj);
        });
        activeSelection.setCoords();
      } else {
        canvas.add(clonedObj);
      }

      clipboard.current.top += 10;
      clipboard.current.left += 10;
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    } catch (error) {
      console.error('Failed to paste object:', error);
    }
  }, [canvas]);

  return { copy, paste, hasCopied };
};
