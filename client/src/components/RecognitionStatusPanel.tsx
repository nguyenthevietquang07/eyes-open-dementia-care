import { Brain, Camera, Hand, ShieldCheck, Zap } from 'lucide-react';
import type { GestureType } from '@/hooks/useGestureDetection';

interface RecognitionStatusPanelProps {
  objectCount: number;
  lastInferenceMs: number | null;
  detectionsPerSecond: number | null;
  gesture: GestureType;
  isGestureAvailable: boolean;
  isHandVisible: boolean;
}

export default function RecognitionStatusPanel({
  objectCount,
  lastInferenceMs,
  detectionsPerSecond,
  gesture,
  isGestureAvailable,
  isHandVisible,
}: RecognitionStatusPanelProps) {
  const inferenceLabel = lastInferenceMs === null ? 'warming up' : `${lastInferenceMs}ms`;
  const rateLabel = detectionsPerSecond === null ? '--' : `${detectionsPerSecond}/s`;

  return (
    <div
      className="absolute bottom-4 left-4 z-50 w-[min(92vw,28rem)] rounded-lg bg-black/80 p-4 text-white shadow-2xl backdrop-blur-sm"
      data-testid="panel-recognition-status"
    >
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-chart-3" />
        <p className="text-sm font-bold uppercase tracking-normal">On-device assistive AI</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span>{objectCount} objects visible</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-4" />
          <span>{inferenceLabel} inference</span>
        </div>
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-chart-2" />
          <span>{rateLabel} detection rate</span>
        </div>
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-chart-3" />
          <span>
            {isGestureAvailable
              ? gesture === 'thumbs_up'
                ? 'thumbs up seen'
                : isHandVisible
                  ? 'hand seen'
                  : 'gesture ready'
              : 'gesture optional'}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/70">
        Camera frames stay in the browser; the server stores only caregiver-created reminders and label metadata.
      </p>
    </div>
  );
}
