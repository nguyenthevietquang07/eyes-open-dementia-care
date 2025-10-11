import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { insertReminderSchema, type InsertReminder } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Plus } from 'lucide-react';
import { z } from 'zod';

const formSchema = insertReminderSchema.extend({
  scheduledFor: z.string().min(1, 'Please select a date and time'),
});

export default function ReminderForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      scheduledFor: '',
      completed: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const parsed = insertReminderSchema.parse({
        ...data,
        scheduledFor: new Date(data.scheduledFor),
      });
      return apiRequest('POST', '/api/reminders', parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: 'Reminder created',
        description: 'The reminder has been successfully created.',
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create reminder. Please try again.',
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate(values as InsertReminder);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Take morning medication" 
                  {...field} 
                  data-testid="input-reminder-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional details..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ''}
                  data-testid="input-reminder-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledFor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Date & Time</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  {...field} 
                  data-testid="input-reminder-datetime"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full gap-2" 
          disabled={createMutation.isPending}
          data-testid="button-create-reminder"
        >
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? 'Creating...' : 'Create Reminder'}
        </Button>
      </form>
    </Form>
  );
}
