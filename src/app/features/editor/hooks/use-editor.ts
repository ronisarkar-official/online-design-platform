import * as fabric from 'fabric';
import { useCallback, useState, useMemo, useRef } from 'react';

import {
	Editor,
	FILL_COLOR,
	STROKE_WIDTH,
	STROKE_COLOR,
	CIRCLE_OPTIONS,
	DIAMOND_OPTIONS,
	TRIANGLE_OPTIONS,
	BuildEditorProps,
	RECTANGLE_OPTIONS,
	EditorHookProps,
	STROKE_DASH_ARRAY,
	FONT_FAMILY,
	FONT_WEIGHT,
	FONT_SIZE,
	JSON_KEYS, // eslint-disable-line @typescript-eslint/no-unused-vars
	STAR_OPTIONS,
	ARROW_OPTIONS,
	HEART_OPTIONS,
	PENTAGON_OPTIONS,
	HEXAGON_OPTIONS,
} from '../types';
import { useHistory } from './use-history';
import {
	createFilter,
	downloadFile, // eslint-disable-line @typescript-eslint/no-unused-vars
	isTextType,
	transformText, // eslint-disable-line @typescript-eslint/no-unused-vars
	createStarPoints,
	createHeartPoints,
	createArrowPoints,
	createHexagonPoints,
	createPentagonPoints,
	createGradient,
} from '../utils';
import { useHotkeys } from './use-hotkeys';
import { useClipboard } from './use-clipboard';
import { useAutoResize } from './use-auto-resize';
import { useCanvasEvents } from './use-canvas-events';
import { useWindowEvents } from './use-window-events';
import { useLoadState } from './use-load-state';

const buildEditor = ({
	save,
	undo,
	redo,
	canRedo,
	canUndo,
	autoZoom,
	copy,
	paste,
	canvas,
	fillColor,
	fontFamily,
	setFontFamily,
	setFillColor,
	strokeColor,
	setStrokeColor,
	strokeWidth,
	setStrokeWidth,
	selectedObjects,
	strokeDashArray,
	setStrokeDashArray,
}: BuildEditorProps): Editor => {
	const generateSaveOptions = () => {
		// eslint-disable-line @typescript-eslint/no-unused-vars
		const { width, height, left, top } = getWorkspace() as fabric.Rect;

		return {
			name: 'Image',
			format: 'png',
			quality: 1,
			width,
			height,
			left,
			top,
		};
	};

	const getWorkspace = () => {
		return canvas
			.getObjects()
			.find(
				(object) =>
					(object as fabric.FabricObject & { name?: string }).name === 'clip',
			);
	};

	const center = (object: fabric.Object) => {
		const centerPoint = new fabric.Point(canvas.width / 2, canvas.height / 2);

		canvas._centerObject(object, centerPoint);
	};

	const addToCanvas = (object: fabric.Object) => {
		center(object);
		canvas.add(object);
		canvas.setActiveObject(object);
		canvas.renderAll();
		save();
	};

	return {
		getWorkspace,
		onUndo: () => undo(),
		onRedo: () => redo(),
		onCopy: () => copy(),
		onPaste: () => paste(),
		changeImageFilter: (value: string) => {
			const objects = canvas.getActiveObjects();
			objects.forEach((object) => {
				if (object.type === 'image') {
					const imageObject = object as fabric.Image;

					const effect = createFilter(value);

					imageObject.filters = effect ? [effect] : [];
					imageObject.applyFilters();
					canvas.renderAll();
				}
			});
			save();
		},
		delete: () => {
			canvas.getActiveObjects().forEach((object) => canvas.remove(object));
			canvas.discardActiveObject();
			canvas.renderAll();
			save();
		},
		addText: (value, options) => {
			const object = new fabric.Textbox(value, {
				left: 100,
				top: 100,
				fontSize: FONT_SIZE,
				fontFamily: FONT_FAMILY,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth,
				strokeDashArray,
				...options,
			});

			addToCanvas(object);
		},
		getActiveOpacity: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return 1;
			}

			const value = selectedObject.get('opacity') || 1;

			return value;
		},
		changeFontSize: (value: number) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, fontSize exists.
					object.set({ fontSize: value });
				}
			});
			canvas.renderAll();
			save();
		},
		getActiveFontSize: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return FONT_SIZE;
			}

			// Faulty TS library, fontSize exists.
			const value = selectedObject.get('fontSize') || FONT_SIZE;

			return value;
		},
		changeTextAlign: (value: string) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, textAlign exists.
					object.set({ textAlign: value });
				}
			});
			canvas.renderAll();
			save();
		},
		getActiveTextAlign: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return 'left';
			}

			// Faulty TS library, textAlign exists.
			const value = selectedObject.get('textAlign') || 'left';

			return value;
		},
		changeFontUnderline: (value: boolean) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, underline exists.
					object.set({ underline: value });
				}
			});
			canvas.renderAll();
			save();
		},
		getActiveFontUnderline: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return false;
			}

			// Faulty TS library, underline exists.
			const value = selectedObject.get('underline') || false;

			return value;
		},
		changeFontLinethrough: (value: boolean) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, linethrough exists.
					object.set({ linethrough: value });
				}
			});
			canvas.renderAll();
			save();
		},
		getActiveFontLinethrough: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return false;
			}

			// Faulty TS library, linethrough exists.
			const value = selectedObject.get('linethrough') || false;

			return value;
		},
		changeFontStyle: (value: string) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, fontStyle exists.
					object.set({ fontStyle: value });
				}
			});
			canvas.renderAll();
			save();
		},
		getActiveFontStyle: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return 'normal';
			}

			// Faulty TS library, fontStyle exists.
			const value = selectedObject.get('fontStyle') || 'normal';

			return value;
		},
		changeFontWeight: (value: number) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, fontWeight exists.
					object.set({ fontWeight: value });
				}
			});
			canvas.renderAll();
			save();
		},
		changeOpacity: (value: number) => {
			canvas.getActiveObjects().forEach((object) => {
				object.set({ opacity: value });
			});
			canvas.renderAll();
			save();
		},
		bringForward: () => {
			canvas.getActiveObjects().forEach((object) => {
				canvas.bringObjectForward(object);
			});

			canvas.renderAll();

			const workspace = getWorkspace();
			if (workspace) {
				canvas.sendObjectToBack(workspace);
			}
			save();
		},
		bringToFront: () => {
			canvas.getActiveObjects().forEach((object) => {
				canvas.bringObjectToFront(object);
			});

			canvas.renderAll();

			const workspace = getWorkspace();
			if (workspace) {
				canvas.sendObjectToBack(workspace);
			}
			save();
		},
		sendBackwards: () => {
			canvas.getActiveObjects().forEach((object) => {
				canvas.sendObjectBackwards(object);
			});

			canvas.renderAll();
			const workspace = getWorkspace();
			if (workspace) {
				canvas.sendObjectToBack(workspace);
			}
			save();
		},
		sendToBack: () => {
			canvas.getActiveObjects().forEach((object) => {
				canvas.sendObjectToBack(object);
			});

			canvas.renderAll();

			const workspace = getWorkspace();
			if (workspace) {
				canvas.sendObjectToBack(workspace);
			}
			save();
		},
		changeFontFamily: (value: string) => {
			setFontFamily(value);
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					// Faulty TS library, fontFamily exists.
					object.set({ fontFamily: value });
				}
			});
			canvas.renderAll();
			save();
		},
		changeFillColor: (value: string) => {
			setFillColor(value);
			canvas.getActiveObjects().forEach((object) => {
				object.set({ fill: value });
			});
			canvas.renderAll();
			save();
		},
		changeStrokeColor: (value: string) => {
			setStrokeColor(value);
			canvas.getActiveObjects().forEach((object) => {
				object.set({ stroke: value });
			});
			if (canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush.color = value;
			}
			canvas.renderAll();
			save();
		},
		changeStrokeWidth: (value: number) => {
			setStrokeWidth(value);
			canvas.getActiveObjects().forEach((object) => {
				object.set({ strokeWidth: value });
				object.setCoords(); // Update object coordinates to fix bounding box
			});
			if (canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush.width = value;
			}
			canvas.renderAll();
			save();
		},
		changeStrokeDashArray: (value: number[]) => {
			setStrokeDashArray(value);
			canvas.getActiveObjects().forEach((object) => {
				object.set({ strokeDashArray: value });
				object.setCoords(); // Update object coordinates to fix bounding box
			});
			canvas.renderAll();
			save();
		},
		addCircle: () => {
			const object = new fabric.Circle({
				...CIRCLE_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addSoftRectangle: () => {
			const object = new fabric.Rect({
				...RECTANGLE_OPTIONS,
				rx: 50,
				ry: 50,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addRectangle: () => {
			const object = new fabric.Rect({
				...RECTANGLE_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addTriangle: () => {
			const object = new fabric.Triangle({
				...TRIANGLE_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addInverseTriangle: () => {
			const HEIGHT = TRIANGLE_OPTIONS.height;
			const WIDTH = TRIANGLE_OPTIONS.width;

			const object = new fabric.Polygon(
				[
					{ x: 0, y: 0 },
					{ x: WIDTH, y: 0 },
					{ x: WIDTH / 2, y: HEIGHT },
				],
				{
					...TRIANGLE_OPTIONS,
					fill: fillColor,
					stroke: strokeColor,
					strokeWidth: strokeWidth,
					strokeDashArray: strokeDashArray,
				},
			);

			addToCanvas(object);
		},
		addDiamond: () => {
			const HEIGHT = DIAMOND_OPTIONS.height;
			const WIDTH = DIAMOND_OPTIONS.width;

			const object = new fabric.Polygon(
				[
					{ x: WIDTH / 2, y: 0 },
					{ x: WIDTH, y: HEIGHT / 2 },
					{ x: WIDTH / 2, y: HEIGHT },
					{ x: 0, y: HEIGHT / 2 },
				],
				{
					...DIAMOND_OPTIONS,
					fill: fillColor,
					stroke: strokeColor,
					strokeWidth: strokeWidth,
					strokeDashArray: strokeDashArray,
				},
			);
			addToCanvas(object);
		},
		canvas,
		getActiveFontWeight: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return FONT_WEIGHT;
			}

			// Faulty TS library, fontWeight exists.
			const value = selectedObject.get('fontWeight') || FONT_WEIGHT;

			return value;
		},
		getActiveFontFamily: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return fontFamily;
			}

			// Faulty TS library, fontFamily exists.
			const value = selectedObject.get('fontFamily') || fontFamily;

			return value;
		},
		getActiveFillColor: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return fillColor;
			}

			const value = selectedObject.get('fill') || fillColor;

			// Currently, gradients & patterns are not supported
			return value as string;
		},
		getActiveStrokeColor: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return strokeColor;
			}

			const value = selectedObject.get('stroke') || strokeColor;

			return value;
		},
		getActiveStrokeWidth: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return strokeWidth;
			}

			const value = selectedObject.get('strokeWidth') || strokeWidth;

			return value;
		},
		getActiveStrokeDashArray: () => {
			const selectedObject = selectedObjects[0];

			if (!selectedObject) {
				return strokeDashArray;
			}

			const value = selectedObject.get('strokeDashArray') || strokeDashArray;

			return value;
		},
		selectedObjects,
		fillColor,
		strokeColor,
		strokeWidth,
		strokeDashArray,
		fontFamily,
		savePng: () => {},
		saveJpg: () => {},
		saveSvg: () => {},
		saveJson: () => {},
		loadJson: (json: string) => {
			try {
				const data = JSON.parse(json);
				canvas.loadFromJSON(data).then(() => {
					const objects = canvas.getObjects();
					
					// Find workspace - it's typically the first Rect with name 'clip' or the first unselectable Rect
					const workspace = objects.find((obj) => {
						const name = (obj as fabric.FabricObject & { name?: string }).name;
						return name === 'clip' || (obj.type === 'Rect' && obj.selectable === false);
					});

					// Restore interactivity for all objects
					objects.forEach((object) => {
						const isWorkspace = object === workspace;
						
						if (isWorkspace) {
							// Keep workspace non-interactive and at back
							object.set({
								selectable: false,
								hasControls: false,
								evented: false,
							});
							canvas.sendObjectToBack(object);
						} else {
							// Make all other objects interactive
							object.set({
								selectable: true,
								hasControls: true,
								evented: true,
								hoverCursor: 'move',
							});
						}
					});
					
					canvas.requestRenderAll();
					
					// Delay autoZoom to ensure canvas is fully ready
					setTimeout(() => {
						try {
							autoZoom();
						} catch (e) {
							console.warn('AutoZoom skipped:', e);
						}
					}, 100);
				});
			} catch (error) {
				console.error('Failed to load JSON:', error);
			}
		},
		canUndo: () => canUndo(),
		canRedo: () => canRedo(),
		autoZoom: () => autoZoom(),
		zoomIn: () => {},
		zoomOut: () => {},
		changeBackground: (value: string) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars
		changeSize: (value: { width: number; height: number }) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars
		enableDrawingMode: () => {
			canvas.discardActiveObject();
			canvas.renderAll();
			canvas.isDrawingMode = true;
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingBrush.width = strokeWidth;
			canvas.freeDrawingBrush.color = strokeColor;
		},
		disableDrawingMode: () => {
			canvas.isDrawingMode = false;
		},
		addImage: (value: string) => {
			fabric.Image.fromURL(value, {
				crossOrigin: 'anonymous',
			}).then((image) => {
				const workspace = getWorkspace() as fabric.Rect;

				image.scaleToWidth(workspace?.width || 500);
				image.scaleToHeight(workspace?.height || 500);

				addToCanvas(image);
			});
		},
		flipImageHorizontal: () => {
			canvas.getActiveObjects().forEach((object) => {
				if (object.type === 'image') {
					object.set('flipX', !object.flipX);
				}
			});
			canvas.renderAll();
		},
		flipImageVertical: () => {
			canvas.getActiveObjects().forEach((object) => {
				if (object.type === 'image') {
					object.set('flipY', !object.flipY);
				}
			});
			canvas.renderAll();
		},
		rotateImage: (angle: number) => {
			canvas.getActiveObjects().forEach((object) => {
				if (object.type === 'image') {
					const currentAngle = object.angle || 0;
					object.rotate(currentAngle + angle);
				}
			});
			canvas.renderAll();
		},
		changeCornerRadius: (value: number) => {
			canvas.getActiveObjects().forEach((object) => {
				if (object.type === 'image') {
					const imageObject = object as fabric.Image;
					if (value === 0) {
						imageObject.set('clipPath', undefined);
					} else {
						const clipPath = new fabric.Rect({
							width: imageObject.width || 0,
							height: imageObject.height || 0,
							rx: value,
							ry: value,
							top: -(imageObject.height || 0) / 2,
							left: -(imageObject.width || 0) / 2,
						});
						imageObject.set('clipPath', clipPath);
					}
				}
			});
			canvas.renderAll();
		},
		getActiveCornerRadius: () => {
			const selectedObject = selectedObjects[0];
			if (!selectedObject || selectedObject.type !== 'image') {
				return 0;
			}
			const imageObject = selectedObject as fabric.Image;
			const clipPath = imageObject.clipPath as fabric.Rect | undefined;
			return clipPath?.rx || 0;
		},
		cropImage: (options: {
			left: number;
			top: number;
			width: number;
			height: number;
		}) => {
			canvas.getActiveObjects().forEach((object) => {
				if (object.type === 'image') {
					const imageObject = object as fabric.Image;
					imageObject.set({
						cropX: options.left,
						cropY: options.top,
						width: options.width,
						height: options.height,
					});
					imageObject.setCoords();
				}
			});
			canvas.renderAll();
		},
		removeBackground: async () => {
			return new Promise((resolve, reject) => {
				// Placeholder for future background removal implementation
				console.log('Background removal feature - ready for API integration');
				reject(
					new Error(
						'Background removal is not yet implemented. Please integrate with a background removal service.',
					),
				);
			});
		},
		addStar: () => {
			const points = createStarPoints(5, 200, 100);
			const object = new fabric.Polygon(points, {
				...STAR_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addArrow: () => {
			const points = createArrowPoints(ARROW_OPTIONS.width, ARROW_OPTIONS.height);
			const object = new fabric.Polygon(points, {
				...ARROW_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addHeart: () => {
			const points = createHeartPoints(HEART_OPTIONS.width, HEART_OPTIONS.height);
			const object = new fabric.Polygon(points, {
				...HEART_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addPentagon: () => {
			const points = createPentagonPoints(PENTAGON_OPTIONS.width);
			const object = new fabric.Polygon(points, {
				...PENTAGON_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addHexagon: () => {
			const points = createHexagonPoints(HEXAGON_OPTIONS.width);
			const object = new fabric.Polygon(points, {
				...HEXAGON_OPTIONS,
				fill: fillColor,
				stroke: strokeColor,
				strokeWidth: strokeWidth,
				strokeDashArray: strokeDashArray,
			});

			addToCanvas(object);
		},
		addSticker: (url: string) => {
			fabric.Image.fromURL(url, {
				crossOrigin: 'anonymous',
			}).then((image) => {
				// Scale sticker to reasonable size
				image.scaleToWidth(200);
				image.scaleToHeight(200);

				addToCanvas(image);
			});
		},
		applyTextShadow: (options: {
			blur: number;
			offsetX: number;
			offsetY: number;
			color: string;
		}) => {
			canvas.getActiveObjects().forEach((object) => {
				if (isTextType(object.type)) {
					object.set({
						shadow: new fabric.Shadow({
							color: options.color,
							blur: options.blur,
							offsetX: options.offsetX,
							offsetY: options.offsetY,
						}),
					});
				}
			});
			canvas.renderAll();
			save();
		},
		applyGradient: (colors: string[], angle: number, type: 'linear' | 'radial') => {
			canvas.getActiveObjects().forEach((object) => {
				const width = (object.width || 100) * (object.scaleX || 1);
				const height = (object.height || 100) * (object.scaleY || 1);

				const gradient = createGradient(canvas, colors, angle, type, width, height);
				object.set({ fill: gradient });
			});
			canvas.renderAll();
			save();
		},
		changeDrawingBrush: (style: string, size: number) => {
			if (canvas.freeDrawingBrush) {
				canvas.freeDrawingBrush.width = size;
				canvas.freeDrawingBrush.color = strokeColor;

				// Different brush styles
				if (style === 'pencil') {
					canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
					canvas.freeDrawingBrush.width = size;
					canvas.freeDrawingBrush.color = strokeColor;
				} else if (style === 'circle') {
					canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
					canvas.freeDrawingBrush.width = size;
					canvas.freeDrawingBrush.color = strokeColor;
				} else if (style === 'spray') {
					canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
					canvas.freeDrawingBrush.width = size;
					canvas.freeDrawingBrush.color = strokeColor;
				}
			}
		},
		save,
	};
};

export const useEditor = ({
	defaultState,
	defaultHeight,
	defaultWidth,
	clearSelectionCallback, // eslint-disable-line @typescript-eslint/no-unused-vars
	saveCallback,
}: EditorHookProps = {}) => {
	const initialState = useRef(defaultState);
	const initialWidth = useRef(defaultWidth || 900);
	const initialHeight = useRef(defaultHeight || 900);

	const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

	const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
	const [fillColor, setFillColor] = useState(FILL_COLOR);
	const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
	const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
	const [strokeDashArray, setStrokeDashArray] =
		useState<number[]>(STROKE_DASH_ARRAY);

	useWindowEvents();

	const {
		save,
		canRedo,
		canUndo,
		undo,
		redo,
		canvasHistoryRef,
		setHistoryIndex,
	} = useHistory({
		canvas,
		saveCallback,
	});

	const { copy, paste } = useClipboard({ canvas });

	const { autoZoom } = useAutoResize({
		canvas,
		container,
	});

	useCanvasEvents({
		canvas,
		setSelectedObjects,
	});

	useHotkeys({
		undo,
		redo,
		copy,
		paste,
		save,
		canvas,
	});

	useLoadState({
		canvas,
		autoZoom,
		initialState,
		canvasHistoryRef,
		setHistoryIndex,
	});

	const editor = useMemo(() => {
		if (canvas) {
			return buildEditor({
				save,
				undo,
				redo,
				canUndo,
				canRedo,
				autoZoom,
				copy,
				paste,
				canvas,
				fillColor,
				strokeWidth,
				strokeColor,
				setFillColor,
				setStrokeColor,
				setStrokeWidth,
				strokeDashArray,
				selectedObjects,
				setStrokeDashArray,
				fontFamily,
				setFontFamily,
			});
		}

		return undefined;
	}, [
		canRedo,
		canUndo,
		undo,
		redo,
		save,
		autoZoom,
		copy,
		paste,
		canvas,
		fillColor,
		strokeWidth,
		strokeColor,
		selectedObjects,
		strokeDashArray,
		fontFamily,
	]);

	const init = useCallback(
		({
			initialCanvas,
			initialContainer,
		}: {
			initialCanvas: fabric.Canvas;
			initialContainer: HTMLDivElement;
		}) => {
			fabric.InteractiveFabricObject.ownDefaults = {
				...fabric.InteractiveFabricObject.ownDefaults,
				cornerColor: '#FFF',
				cornerStyle: 'circle',
				borderColor: '#3b82f6',
				borderScaleFactor: 1.5,
				transparentCorners: false,
				borderOpacityWhenMoving: 1,
				cornerStrokeColor: '#3b82f6',
			};

			const initialWorkspace = new fabric.Rect({
				width: initialWidth.current,
				height: initialHeight.current,
				name: 'clip',
				fill: 'white',
				selectable: false,
				hasControls: false,
				shadow: new fabric.Shadow({
					color: 'rgba(0,0,0,0.8)',
					blur: 5,
				}),
			});

			initialCanvas.setWidth(initialContainer.offsetWidth);
			initialCanvas.setHeight(initialContainer.offsetHeight);

			initialCanvas.add(initialWorkspace);
			initialCanvas.centerObject(initialWorkspace);
			// Removed clipPath assignment - it prevents objects from being selectable
		initialCanvas.sendObjectToBack(initialWorkspace); // Send workspace to back so it doesn't block clicks

			setCanvas(initialCanvas);
			setContainer(initialContainer);
		},
		[],
	);

	return { init, editor };
};
