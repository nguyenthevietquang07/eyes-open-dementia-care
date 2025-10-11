import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean
) {
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        const model = await cocoSsd.load();
        if (isMounted) {
          modelRef.current = model;
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error('Error loading COCO-SSD model:', error);
        setIsModelLoading(false);
      }
    }

    loadModel();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !modelRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    async function detectFrame() {
      if (!modelRef.current || !video || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        const predictions = await modelRef.current.detect(video);
        setDetectedObjects(predictions);
      } catch (error) {
        console.error('Detection error:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    }

    detectFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, videoRef]);

  return { detectedObjects, isModelLoading };
}
