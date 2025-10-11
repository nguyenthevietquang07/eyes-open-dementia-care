import { Label } from '@shared/schema';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface WarningAlertProps {
  object: Label;
  onDismiss: () => void;
}

export default function WarningAlert({ object, onDismiss }: WarningAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 px-8"
      data-testid="alert-warning"
    >
      <div className="bg-destructive/95 text-destructive-foreground px-16 py-16 rounded-3xl shadow-2xl backdrop-blur-sm mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-8 mb-8">
          <AlertTriangle className="h-24 w-24" />
          <p className="text-7xl font-black uppercase tracking-wide">Warning</p>
        </div>
        <p className="text-5xl font-bold text-center leading-tight">
          You've been here recently
        </p>
        <p className="text-4xl text-center mt-6 opacity-90">
          {object.name}
        </p>
      </div>
    </motion.div>
  );
}
