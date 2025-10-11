import { Reminder } from '@shared/schema';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderNotificationProps {
  reminder: Reminder;
}

export default function ReminderNotification({ reminder }: ReminderNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-4xl"
      data-testid={`notification-reminder-${reminder.id}`}
    >
      <div className="bg-chart-2/95 text-white px-16 py-12 rounded-3xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-6 mb-6">
          <Bell className="h-16 w-16" />
          <div className="flex-1">
            <p className="text-6xl font-bold leading-tight">
              {reminder.title}
            </p>
            {reminder.description && (
              <p className="text-4xl mt-4 opacity-90">
                {reminder.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-3xl opacity-80 text-center mt-6">
          {format(new Date(reminder.scheduledFor), 'p')}
        </div>
        <div className="text-4xl font-bold text-center mt-8 opacity-90">
          👍 Show thumbs up when done
        </div>
      </div>
    </motion.div>
  );
}
