import { useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export function useDetectedObjects(imageData: string) {
  const [objects, setObjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageData) return;

    let isMounted = true;

    async function detectObjects() {
      setIsLoading(true);
      try {
        const model = await cocoSsd.load();
        
        const img = new Image();
        img.src = imageData;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const predictions = await model.detect(img);
        
        if (isMounted) {
          const uniqueClasses = new Set(predictions.map(p => p.class));
          const detectedClasses = Array.from(uniqueClasses);
          setObjects(detectedClasses);
        }
      } catch (error) {
        console.error('Error detecting objects:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    detectObjects();

    return () => {
      isMounted = false;
    };
  }, [imageData]);

  return { objects, isLoading };
}
