import { useEffect, useRef, useState } from 'react';
import type { ObjectDetection } from '@tensorflow-models/coco-ssd';

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
  const [isModelReady, setIsModelReady] = useState(false);
  const [lastInferenceMs, setLastInferenceMs] = useState<number | null>(null);
  const [detectionsPerSecond, setDetectionsPerSecond] = useState<number | null>(null);
  const modelRef = useRef<ObjectDetection | null>(null);
  const animationFrameRef = useRef<number>();
  const frameTimesRef = useRef<number[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const model = await cocoSsd.load();
        if (isMounted) {
          modelRef.current = model;
          setIsModelReady(true);
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
    if (!isActive || !isModelReady || !modelRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    async function detectFrame() {
      if (!modelRef.current || !video || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      try {
        const startedAt = performance.now();
        const predictions = await modelRef.current.detect(video);
        const finishedAt = performance.now();
        const inferenceMs = Math.round(finishedAt - startedAt);
        const frameTimes = [...frameTimesRef.current, finishedAt].slice(-12);
        frameTimesRef.current = frameTimes;

        if (frameTimes.length >= 2) {
          const elapsedSeconds = (frameTimes[frameTimes.length - 1] - frameTimes[0]) / 1000;
          setDetectionsPerSecond(
            elapsedSeconds > 0 ? Number(((frameTimes.length - 1) / elapsedSeconds).toFixed(1)) : null
          );
        }

        setLastInferenceMs(inferenceMs);
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
  }, [isActive, isModelReady, videoRef]);

  return { detectedObjects, isModelLoading, lastInferenceMs, detectionsPerSecond };
}
