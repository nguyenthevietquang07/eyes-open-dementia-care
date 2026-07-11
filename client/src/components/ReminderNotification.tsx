import { Reminder } from '@shared/schema';
import { motion } from 'framer-motion';
import { Bell, Hand } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderNotificationProps {
  reminder: Reminder;
}

export default function ReminderNotification({ reminder }: ReminderNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-32 left-1/2 z-20 w-11/12 max-w-4xl -translate-x-1/2"
      data-testid={`notification-reminder-${reminder.id}`}
    >
      <div className="rounded-3xl bg-chart-2/95 px-16 py-12 text-white shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-6">
          <Bell className="h-16 w-16" />
          <div className="flex-1">
            <p className="text-6xl font-bold leading-tight">
              {reminder.title}
            </p>
            {reminder.description && (
              <p className="mt-4 text-4xl opacity-90">
                {reminder.description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 text-center text-3xl opacity-80">
          {format(new Date(reminder.scheduledFor), 'p')}
        </div>
        <div className="mt-8 flex items-center justify-center gap-4 text-4xl font-bold opacity-90">
          <Hand className="h-12 w-12" />
          Raise your thumb when done
        </div>
      </div>
    </motion.div>
  );
}
