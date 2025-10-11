import { useEffect, useRef, useState, useCallback } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

export function useVisualMatcher() {
  const modelRef = useRef<mobilenet.MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const labelCacheRef = useRef<Map<string, number[] | null>>(new Map());

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
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
    
    let tensor: tf.Tensor | null = null;
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
      
      const detectedCanvas = await preprocessImage(videoFrame, x, y, width, height);
      const detectedFeatures = await extractFeatures(detectedCanvas);
      if (!detectedFeatures) {
        console.warn('Failed to extract features from detected region');
        return 0;
      }

      let labelFeatures = labelCacheRef.current.get(labelImage) || null;
      
      if (!labelFeatures || labelFeatures === null) {
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
        } else {
          console.warn('Failed to extract features from label image');
          return 0;
        }
      }

      const similarity = cosineSimilarity(detectedFeatures, labelFeatures);
      if (similarity > 0.5) {
        console.log(`Visual match: ${(similarity * 100).toFixed(1)}%`);
      }
      return similarity;
    } catch (error) {
      console.error('Error in visual matching:', error);
      return 0;
    }
  }, []);

  return { matchVisual, isModelLoading };
}
