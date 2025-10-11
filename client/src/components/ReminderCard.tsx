import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reminder } from '@shared/schema';
import { Clock, Check, Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ReminderCardProps {
  reminder: Reminder;
}

export default function ReminderCard({ reminder }: ReminderCardProps) {
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: () => apiRequest('PATCH', `/api/reminders/${reminder.id}`, { completed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: 'Reminder completed',
        description: 'The reminder has been marked as complete.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/reminders/${reminder.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: 'Reminder deleted',
        description: 'The reminder has been removed.',
      });
    },
  });

  const scheduledDate = new Date(reminder.scheduledFor);
  const isUpcoming = scheduledDate > new Date();

  return (
    <Card data-testid={`card-reminder-${reminder.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight" data-testid="text-reminder-title">
            {reminder.title}
          </h3>
          {reminder.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {reminder.description}
            </p>
          )}
        </div>
        <Badge variant={isUpcoming ? 'default' : 'secondary'}>
          {isUpcoming ? 'Upcoming' : 'Due'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span data-testid="text-reminder-time">
            {format(scheduledDate, 'PPp')}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            data-testid={`button-complete-reminder-${reminder.id}`}
          >
            <Check className="h-4 w-4" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-reminder-${reminder.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
