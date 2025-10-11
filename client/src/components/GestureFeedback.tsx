import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function GestureFeedback() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-chart-3/20 backdrop-blur-sm"
      data-testid="feedback-gesture"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="bg-chart-3/95 text-white rounded-full p-24"
      >
        <CheckCircle className="h-48 w-48" />
      </motion.div>
    </motion.div>
  );
}
