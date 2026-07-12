import { useEffect, useRef, useState, useCallback } from 'react';
import type { MobileNet } from '@tensorflow-models/mobilenet';
import type { Tensor } from '@tensorflow/tfjs';

type CropRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function useVisualMatcher() {
  const modelRef = useRef<MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const labelCacheRef = useRef<Map<string, number[] | null>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        await import('@tensorflow/tfjs');
        const mobilenet = await import('@tensorflow-models/mobilenet');
        const model = await mobilenet.load();
        if (isMounted) {
          modelRef.current = model;
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error('Error loading MobileNet model:', error);
        setIsModelLoading(false);
      }
    }

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  const preprocessImage = async (
    source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    x = 0,
    y = 0,
    w?: number,
    h?: number
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 224;
    canvas.height = 224;

    let sourceWidth = w;
    let sourceHeight = h;

    if (!sourceWidth || !sourceHeight) {
      if (source instanceof HTMLImageElement) {
        sourceWidth = source.naturalWidth;
        sourceHeight = source.naturalHeight;
      } else if (source instanceof HTMLVideoElement) {
        sourceWidth = source.videoWidth;
        sourceHeight = source.videoHeight;
      } else if (source instanceof HTMLCanvasElement) {
        sourceWidth = source.width;
        sourceHeight = source.height;
      }
    }

    sourceWidth = Math.max(1, sourceWidth || 224);
    sourceHeight = Math.max(1, sourceHeight || 224);

    // Maintain aspect ratio with letterboxing
    const aspectRatio = sourceWidth / sourceHeight;
    let drawWidth = 224;
    let drawHeight = 224;
    let offsetX = 0;
    let offsetY = 0;

    if (aspectRatio > 1) {
      // Wider than tall
      drawHeight = 224 / aspectRatio;
      offsetY = (224 - drawHeight) / 2;
    } else {
      // Taller than wide
      drawWidth = 224 * aspectRatio;
      offsetX = (224 - drawWidth) / 2;
    }

    // Fill with black background (letterboxing)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 224, 224);

    ctx.drawImage(
      source,
      x, y, sourceWidth, sourceHeight,
      offsetX, offsetY, drawWidth, drawHeight
    );

    return canvas;
  };

  const extractFeatures = async (canvas: HTMLCanvasElement): Promise<number[] | null> => {
    if (!modelRef.current) return null;
    
    let tensor: Tensor | null = null;
    try {
      tensor = await modelRef.current.infer(canvas, { embedding: true } as any);
      const features = await tensor.data();
      const normalized = Array.from(features);
      
      const norm = Math.sqrt(normalized.reduce((sum, val) => sum + val * val, 0));
      return normalized.map(val => val / (norm || 1));
    } catch (error) {
      console.error('Error extracting features:', error);
      return null;
    } finally {
      if (tensor) {
        tensor.dispose();
      }
    }
  };

  const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    return Math.max(0, Math.min(1, dotProduct));
  };

  const getLabelFeatures = async (labelImage: string): Promise<number[] | null> => {
    let labelFeatures = labelCacheRef.current.get(labelImage) || null;

    if (labelFeatures) {
      return labelFeatures;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = labelImage;
    });

    const labelCanvas = await preprocessImage(img);
    labelFeatures = await extractFeatures(labelCanvas);

    if (labelFeatures) {
      labelCacheRef.current.set(labelImage, labelFeatures);
      return labelFeatures;
    }

    console.warn('Failed to extract features from label image');
    return null;
  };

  const compareSourceToLabel = async (
    source: HTMLVideoElement,
    labelImage: string,
    crop?: CropRegion
  ): Promise<number> => {
    if (!modelRef.current) return 0;

    const canvas = crop
      ? await preprocessImage(source, crop.x, crop.y, crop.width, crop.height)
      : await preprocessImage(source);
    const sourceFeatures = await extractFeatures(canvas);
    if (!sourceFeatures) return 0;

    const labelFeatures = await getLabelFeatures(labelImage);
    if (!labelFeatures) return 0;

    return cosineSimilarity(sourceFeatures, labelFeatures);
  };

  const matchVisual = useCallback(async (
    videoFrame: HTMLVideoElement,
    bbox: [number, number, number, number],
    labelImage: string
  ): Promise<number> => {
    if (!modelRef.current) return 0;

    try {
      // COCO-SSD returns bbox in video's intrinsic coordinates
      const [bx, by, bw, bh] = bbox;
      
      // Clamp bbox to video dimensions
      const x = Math.max(0, Math.min(bx, videoFrame.videoWidth));
      const y = Math.max(0, Math.min(by, videoFrame.videoHeight));
      const width = Math.max(1, Math.min(bw, videoFrame.videoWidth - x));
      const height = Math.max(1, Math.min(bh, videoFrame.videoHeight - y));
      
      const similarity = await compareSourceToLabel(videoFrame, labelImage, { x, y, width, height });
      if (similarity > 0.5) {
        console.log(`Visual match: ${(similarity * 100).toFixed(1)}%`);
      }
      return similarity;
    } catch (error) {
      console.error('Error in visual matching:', error);
      return 0;
    }
  }, []);

  const matchFrameVisual = useCallback(async (
    videoFrame: HTMLVideoElement,
    labelImage: string
  ): Promise<number> => {
    if (!modelRef.current || videoFrame.videoWidth === 0 || videoFrame.videoHeight === 0) {
      return 0;
    }

    try {
      const width = videoFrame.videoWidth;
      const height = videoFrame.videoHeight;
      const centerSide = Math.min(width, height) * 0.68;
      const objectWidth = width * 0.55;
      const objectHeight = height * 0.68;
      const crops: Array<CropRegion | undefined> = [
        undefined,
        {
          x: (width - centerSide) / 2,
          y: (height - centerSide) / 2,
          width: centerSide,
          height: centerSide,
        },
        {
          x: (width - objectWidth) / 2,
          y: (height - objectHeight) / 2,
          width: objectWidth,
          height: objectHeight,
        },
      ];

      const scores = await Promise.all(
        crops.map((crop) => compareSourceToLabel(videoFrame, labelImage, crop))
      );
      const similarity = Math.max(...scores);
      if (similarity > 0.5) {
        console.log(`Frame label match: ${(similarity * 100).toFixed(1)}%`);
      }
      return similarity;
    } catch (error) {
      console.error('Error in frame visual matching:', error);
      return 0;
    }
  }, []);

  return { matchVisual, matchFrameVisual, isModelLoading };
}
