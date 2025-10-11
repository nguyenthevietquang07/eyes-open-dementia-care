import { Label } from '@shared/schema';
import { motion } from 'framer-motion';
import { User, Package } from 'lucide-react';

interface ObjectLabelOverlayProps {
  label: Label;
}

export default function ObjectLabelOverlay({ label }: ObjectLabelOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-24 left-1/2 -translate-x-1/2 z-10"
      data-testid={`overlay-label-${label.id}`}
    >
      <div className="bg-primary/95 text-primary-foreground px-12 py-6 rounded-3xl shadow-2xl backdrop-blur-sm border-4 border-white/20">
        <p className="text-7xl font-black uppercase tracking-wide text-center mb-2">
          {label.name}
        </p>
        {label.detectedObjects && label.detectedObjects.length > 0 && (
          <div 
            className="flex items-center justify-center gap-2 text-xl opacity-80"
            data-testid="text-label-detections"
          >
            {label.category === 'person' ? (
              <User className="h-6 w-6" />
            ) : (
              <Package className="h-6 w-6" />
            )}
            <span>{label.detectedObjects.join(', ')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
