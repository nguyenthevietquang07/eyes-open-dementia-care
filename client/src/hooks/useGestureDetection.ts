import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';

export type GestureType = 'thumbs_up' | 'none';

export function useGestureDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean
) {
  const [gesture, setGesture] = useState<GestureType>('none');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const animationFrameRef = useRef<number>();

  const detectThumbsUp = useCallback((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setGesture('none');
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    
    const isThumbUp = thumbTip.y < thumbIp.y - 0.1;
    const isFistClosed = 
      landmarks[8].y > landmarks[6].y &&
      landmarks[12].y > landmarks[10].y &&
      landmarks[16].y > landmarks[14].y &&
      landmarks[20].y > landmarks[18].y;
    
    if (isThumbUp && isFistClosed) {
      setGesture('thumbs_up');
    } else {
      setGesture('none');
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let isMounted = true;

    async function initializeHands() {
      try {
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(detectThumbsUp);

        if (isMounted) {
          handsRef.current = hands;
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('Error initializing MediaPipe Hands:', err);
        if (isMounted) {
          setError('Gesture detection unavailable');
          setIsModelLoading(false);
        }
      }
    }

    initializeHands();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [isActive, detectThumbsUp]);

  useEffect(() => {
    if (!isActive || !handsRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    async function detectGesture() {
      if (!handsRef.current || !video || video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectGesture);
        return;
      }

      try {
        await handsRef.current.send({ image: video });
      } catch (err) {
        console.error('Gesture detection error:', err);
      }

      animationFrameRef.current = requestAnimationFrame(detectGesture);
    }

    detectGesture();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, videoRef]);

  return { gesture, isModelLoading, error };
}
