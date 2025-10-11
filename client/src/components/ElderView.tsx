import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Reminder, Label } from '@shared/schema';
import ObjectLabelOverlay from './ObjectLabelOverlay';
import ReminderNotification from './ReminderNotification';
import WarningAlert from './WarningAlert';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import { useVisualMatcher } from '@/hooks/useVisualMatcher';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ElderView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedLabels, setDetectedLabels] = useState<Label[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningObject, setWarningObject] = useState<Label | null>(null);
  const lastSeenRef = useRef<Map<string, number>>(new Map());
  const { setMode } = useMode();

  const { data: reminders } = useQuery<Reminder[]>({
    queryKey: ['/api/reminders'],
    refetchInterval: 10000,
  });

  const { data: labels } = useQuery<Label[]>({
    queryKey: ['/api/labels'],
  });

  const { detectedObjects, isModelLoading: isObjectModelLoading } = useObjectDetection(
    videoRef,
    cameraActive
  );

  const { matchVisual, isModelLoading: isMatcherLoading } = useVisualMatcher();

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/reminders/${id}`, { completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
    },
  });

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setCameraActive(true);
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!labels || !detectedObjects.length || !videoRef.current || !matchVisual) {
      setDetectedLabels([]);
      return;
    }

    let cancelled = false;
    const currentTime = Date.now();
    
    const matchTimeout = setTimeout(async () => {
      if (cancelled) return;
      
      const matchedLabels: Label[] = [];
      const SIMILARITY_THRESHOLD = 0.65; // 65% visual similarity required
      
      for (const obj of detectedObjects) {
        if (cancelled) break;
        
        const potentialMatches = labels.filter(label => 
          label.detectedObjects?.some(detObj => 
            detObj.toLowerCase().includes(obj.class.toLowerCase()) ||
            obj.class.toLowerCase().includes(detObj.toLowerCase())
          )
        );

        for (const label of potentialMatches) {
          if (cancelled) break;
          if (matchedLabels.find(l => l.id === label.id)) continue;

          const similarity = await matchVisual(
            videoRef.current!,
            obj.bbox,
            label.imageData
          );

          if (similarity >= SIMILARITY_THRESHOLD) {
            matchedLabels.push(label);
            
            const lastSeen = lastSeenRef.current.get(label.id);
            if (lastSeen && currentTime - lastSeen < 30000) {
              setWarningObject(label);
              setShowWarning(true);
              setTimeout(() => setShowWarning(false), 5000);
            }
            
            lastSeenRef.current.set(label.id, currentTime);
            break; // Found a match for this detection, move to next
          }
        }
      }

      if (!cancelled) {
        setDetectedLabels(matchedLabels);
      }
    }, 500); // Throttle to 500ms

    return () => {
      cancelled = true;
      clearTimeout(matchTimeout);
    };
  }, [detectedObjects, labels, matchVisual]);


  const activeReminders = reminders?.filter(r => {
    if (r.completed) return false;
    const scheduledDate = new Date(r.scheduledFor);
    const now = new Date();
    const timeDiff = scheduledDate.getTime() - now.getTime();
    return timeDiff > -300000 && timeDiff < 300000;
  }) || [];

  const isLoading = isObjectModelLoading || isMatcherLoading;

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        data-testid="video-camera-feed"
      />

      <button
        onClick={() => setMode('caregiver')}
        className="absolute top-4 left-4 p-4 bg-white/90 rounded-full hover:bg-white transition-colors z-50"
        data-testid="button-back-to-caregiver"
        aria-label="Back to Caregiver Mode"
      >
        <ArrowLeft className="h-8 w-8 text-black" />
      </button>

      {cameraActive && !isLoading && (
        <div 
          className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg z-50 max-w-xs"
          data-testid="panel-live-detections"
        >
          <p className="text-white text-sm font-semibold mb-2">Live Detection:</p>
          {detectedObjects.length > 0 ? (
            <div className="space-y-1">
              {detectedObjects.slice(0, 5).map((obj, idx) => (
                <div 
                  key={idx} 
                  className="text-white text-xs"
                  data-testid={`text-detected-object-${idx}`}
                >
                  {obj.class} ({Math.round(obj.score * 100)}%)
                </div>
              ))}
            </div>
          ) : (
            <p 
              className="text-white/60 text-xs"
              data-testid="text-no-detections"
            >
              No objects detected
            </p>
          )}
        </div>
      )}

      {(!cameraActive || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <Loader2 className="mx-auto h-24 w-24 text-white animate-spin mb-6" />
            <p className="text-4xl font-bold text-white">
              {!cameraActive ? 'Starting Camera...' : 'Loading AI Recognition...'}
            </p>
          </div>
        </div>
      )}

      {detectedLabels.map((label) => (
        <ObjectLabelOverlay key={label.id} label={label} />
      ))}

      {activeReminders.map((reminder) => (
        <ReminderNotification 
          key={reminder.id} 
          reminder={reminder}
        />
      ))}

      {showWarning && warningObject && (
        <WarningAlert 
          object={warningObject}
          onDismiss={() => setShowWarning(false)}
        />
      )}

    </div>
  );
}
