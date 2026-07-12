import { useEffect, useRef, useState, useCallback } from 'react';
import type { Hands, Results } from '@mediapipe/hands';

export type GestureType = 'thumbs_up' | 'none';

type Landmark = Results['multiHandLandmarks'][number][number];

function distance(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerCurled(landmarks: Landmark[], tipIndex: number, pipIndex: number, mcpIndex: number) {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];

  return tip.y > pip.y - 0.015 || tip.y > mcp.y - 0.01;
}

function isThumbsUpPose(landmarks: Landmark[]) {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  const palmWidth = Math.max(distance(indexMcp, pinkyMcp), 0.08);
  const thumbLift = Math.min(thumbIp.y, thumbMcp.y, wrist.y) - thumbTip.y;
  const thumbIsRaised = thumbLift > Math.max(0.035, palmWidth * 0.25);
  const thumbIsNotTucked = distance(thumbTip, indexMcp) > palmWidth * 0.25;
  const curledFingers = [
    isFingerCurled(landmarks, 8, 6, 5),
    isFingerCurled(landmarks, 12, 10, 9),
    isFingerCurled(landmarks, 16, 14, 13),
    isFingerCurled(landmarks, 20, 18, 17),
  ].filter(Boolean).length;

  return thumbIsRaised && thumbIsNotTucked && curledFingers >= 3;
}

export function useGestureDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  isActive: boolean
) {
  const [gesture, setGesture] = useState<GestureType>('none');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const animationFrameRef = useRef<number>();
  const thumbsUpFrameCountRef = useRef(0);

  const detectThumbsUp = useCallback((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      thumbsUpFrameCountRef.current = 0;
      setGesture('none');
      return;
    }

    const landmarks = results.multiHandLandmarks[0];

    if (isThumbsUpPose(landmarks)) {
      thumbsUpFrameCountRef.current += 1;
    } else {
      thumbsUpFrameCountRef.current = 0;
    }

    if (thumbsUpFrameCountRef.current >= 2) {
      setGesture('thumbs_up');
    } else {
      setGesture('none');
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      thumbsUpFrameCountRef.current = 0;
      setGesture('none');
      return;
    }

    let isMounted = true;

    async function initializeHands() {
      try {
        const { Hands } = await import('@mediapipe/hands');
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.35,
          minTrackingConfidence: 0.35,
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
      thumbsUpFrameCountRef.current = 0;
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
