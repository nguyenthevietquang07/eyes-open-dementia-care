import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Reminder, Label } from '@shared/schema';
import ObjectLabelOverlay from './ObjectLabelOverlay';
import ReminderNotification from './ReminderNotification';
import WarningAlert from './WarningAlert';
import GestureFeedback from './GestureFeedback';
import { useObjectDetection } from '@/hooks/useObjectDetection';
import { useGestureDetection } from '@/hooks/useGestureDetection';
import { Camera, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ElderView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedLabels, setDetectedLabels] = useState<Label[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningObject, setWarningObject] = useState<Label | null>(null);
  const [gestureDetected, setGestureDetected] = useState(false);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

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

  const { gesture, isModelLoading: isGestureModelLoading, error: gestureError } = useGestureDetection(
    videoRef,
    cameraActive
  );

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
    if (!labels || !detectedObjects.length) {
      setDetectedLabels([]);
      return;
    }

    const currentTime = Date.now();
    const matchedLabels: Label[] = [];
    
    detectedObjects.forEach(obj => {
      const matchedLabel = labels.find(label => 
        label.detectedObjects?.some(detObj => 
          detObj.toLowerCase().includes(obj.class.toLowerCase()) ||
          obj.class.toLowerCase().includes(detObj.toLowerCase())
        )
      );

      if (matchedLabel && !matchedLabels.find(l => l.id === matchedLabel.id)) {
        matchedLabels.push(matchedLabel);
        
        const lastSeen = lastSeenRef.current.get(matchedLabel.id);
        if (lastSeen && currentTime - lastSeen < 30000) {
          setWarningObject(matchedLabel);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
        
        lastSeenRef.current.set(matchedLabel.id, currentTime);
      }
    });

    setDetectedLabels(matchedLabels);
  }, [detectedObjects, labels]);

  useEffect(() => {
    if (gesture === 'thumbs_up' && activeReminders.length > 0) {
      setGestureDetected(true);
      
      const oldestReminder = activeReminders[0];
      completeMutation.mutate(oldestReminder.id);

      setTimeout(() => setGestureDetected(false), 2000);
    }
  }, [gesture]);

  const activeReminders = reminders?.filter(r => {
    if (r.completed) return false;
    const scheduledDate = new Date(r.scheduledFor);
    const now = new Date();
    const timeDiff = scheduledDate.getTime() - now.getTime();
    return timeDiff > -300000 && timeDiff < 300000;
  }) || [];

  const isLoading = isObjectModelLoading || isGestureModelLoading;

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

      {(!cameraActive || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <Loader2 className="mx-auto h-24 w-24 text-white animate-spin mb-6" />
            <p className="text-4xl font-bold text-white">
              {!cameraActive ? 'Starting Camera...' : 'Loading AI Models...'}
            </p>
            {gestureError && (
              <p className="text-2xl text-red-400 mt-4">
                Gesture detection unavailable - thumbs up won't work
              </p>
            )}
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

      {gestureDetected && <GestureFeedback />}
    </div>
  );
}
