/**
 * ImageEditor - Professional Image Editing with Fabric.js
 * Editor visual completo com crop, filtros, text, shapes
 */

import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
    IconCrop,
    IconFilter,
    IconText,
    IconShape,
    IconBrush,
    IconEraser,
    IconUndo,
    IconRedo,
    IconDownload,
    IconX,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageEditorProps {
    imageUrl: string;
    onSave: (editedImageUrl: string) => void;
    onClose: () => void;
}

type EditorTool = 'select' | 'crop' | 'text' | 'shape' | 'brush' | 'eraser';

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<EditorTool>('select');
    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Initialize Fabric canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#1a1a1a',
        });

        // Load image
        fabric.Image.fromURL(imageUrl, (img) => {
            // Scale to fit canvas
            const scale = Math.min(
                fabricCanvas.width! / img.width!,
                fabricCanvas.height! / img.height!
            );
            img.scale(scale);
            img.center();
            fabricCanvas.setBackgroundImage(img as any, fabricCanvas.renderAll.bind(fabricCanvas));
        });

        setCanvas(fabricCanvas);
        saveState(fabricCanvas);

        return () => {
            fabricCanvas.dispose();
        };
    }, [imageUrl]);

    // Save canvas state for undo/redo
    const saveState = (canvas: fabric.Canvas) => {
        const json = JSON.stringify(canvas.toJSON());
        setHistory((prev) => [...prev.slice(0, historyStep + 1), json]);
        setHistoryStep((prev) => prev + 1);
    };

    // Undo
    const handleUndo = () => {
        if (historyStep > 0 && canvas) {
            setHistoryStep(historyStep - 1);
            canvas.loadFromJSON(history[historyStep - 1], () => {
                canvas.renderAll();
            });
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyStep < history.length - 1 && canvas) {
            setHistoryStep(historyStep + 1);
            canvas.loadFromJSON(history[historyStep + 1], () => {
                canvas.renderAll();
            });
        }
    };

    // Add text
    const addText = () => {
        if (!canvas) return;

        const text = new fabric.IText('Digite aqui...', {
            left: 100,
            top: 100,
            fontFamily: 'Arial',
            fill: '#ffffff',
            fontSize: 32,
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        saveState(canvas);
    };

    // Add shape
    const addShape = (shapeType: 'rect' | 'circle' | 'triangle') => {
        if (!canvas) return;

        let shape: fabric.Object;

        switch (shapeType) {
            case 'rect':
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: '#3b82f6',
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: 100,
                    top: 100,
                    radius: 50,
                    fill: '#8b5cf6',
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: '#10b981',
                });
                break;
        }

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
        saveState(canvas);
    };

    // Enable drawing mode
    const enableDrawing = () => {
        if (!canvas) return;

        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = 5;
        canvas.freeDrawingBrush.color = '#ffffff';
        setActiveTool('brush');
    };

    // Disable drawing mode
    const disableDrawing = () => {
        if (!canvas) return;
        canvas.isDrawingMode = false;
        setActiveTool('select');
    };

    // Apply filter
    const applyFilter = (filterType: 'brightness' | 'contrast' | 'grayscale' | 'blur') => {
        if (!canvas) return;

        const bgImage = canvas.backgroundImage as fabric.Image;
        if (!bgImage) return;

        switch (filterType) {
            case 'brightness':
                bgImage.filters?.push(new fabric.Image.filters.Brightness({ brightness: 0.2 }));
                break;
            case 'contrast':
                bgImage.filters?.push(new fabric.Image.filters.Contrast({ contrast: 0.3 }));
                break;
            case 'grayscale':
                bgImage.filters?.push(new fabric.Image.filters.Grayscale());
                break;
            case 'blur':
                bgImage.filters?.push(new fabric.Image.filters.Blur({ blur: 0.5 }));
                break;
        }

        bgImage.applyFilters();
        canvas.renderAll();
        saveState(canvas);
        toast.success(`Filtro ${filterType} aplicado`);
    };

    // Export canvas
    const handleExport = (format: 'png' | 'jpeg' | 'webp') => {
        if (!canvas) return;

        const dataURL = canvas.toDataURL({
            format: format === 'jpeg' ? 'jpeg' : 'png',
            quality: 0.9,
        });

        onSave(dataURL);
        toast.success('Imagem exportada!');
    };

    // Download canvas
    const handleDownload = () => {
        if (!canvas) return;

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1.0,
        });

        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = dataURL;
        link.click();

        toast.success('Download iniciado!');
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">Editor de Imagem</h2>

                    {/* Tools */}
                    <div className="flex gap-2">
                        <button
                            onClick={addText}
                            className={cn(
                                'p-2 rounded-lg transition',
                                activeTool === 'text'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                            title="Adicionar texto"
                        >
                            <IconText className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => addShape('rect')}
                            className="p-2 bg-white/10 text-gray-300 hover:bg-white/20 rounded-lg transition"
                            title="Adicionar retângulo"
                        >
                            <IconShape className="w-5 h-5" />
                        </button>

                        <button
                            onClick={enableDrawing}
                            className={cn(
                                'p-2 rounded-lg transition',
                                activeTool === 'brush'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            )}
                            title="Desenhar"
                        >
                            <IconBrush className="w-5 h-5" />
                        </button>

                        {activeTool === 'brush' && (
                            <button
                                onClick={disableDrawing}
                                className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition"
                                title="Parar de desenhar"
                            >
                                <IconEraser className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 border-l border-white/20 pl-4">
                        <button
                            onClick={() => applyFilter('brightness')}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sm text-gray-300 rounded-lg transition"
                        >
                            Brilho+
                        </button>
                        <button
                            onClick={() => applyFilter('contrast')}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sm text-gray-300 rounded-lg transition"
                        >
                            Contraste+
                        </button>
                        <button
                            onClick={() => applyFilter('grayscale')}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sm text-gray-300 rounded-lg transition"
                        >
                            P&B
                        </button>
                        <button
                            onClick={() => applyFilter('blur')}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sm text-gray-300 rounded-lg transition"
                        >
                            Blur
                        </button>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyStep <= 0}
                        className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Desfazer"
                    >
                        <IconUndo className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={historyStep >= history.length - 1}
                        className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refazer"
                    >
                        <IconRedo className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <IconDownload className="w-5 h-5" />
                        Download
                    </button>

                    <button
                        onClick={() => handleExport('png')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                        Salvar
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition"
                    >
                        <IconX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-8">
                <canvas ref={canvasRef} className="shadow-2xl" />
            </div>

            {/* Bottom Info */}
            <div className="px-6 py-3 border-t border-white/10 text-sm text-gray-400 text-center">
                💡 Dica: Use as ferramentas acima para adicionar texto, formas, desenhar ou aplicar filtros
            </div>
        </div>
    );
}

