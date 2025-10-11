import { Label } from '@shared/schema';
import { motion } from 'framer-motion';

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
      <div className="bg-primary/95 text-primary-foreground px-12 py-6 rounded-full shadow-2xl backdrop-blur-sm">
        <p className="text-7xl font-black uppercase tracking-wide text-center">
          {label.name}
        </p>
      </div>
    </motion.div>
  );
}
