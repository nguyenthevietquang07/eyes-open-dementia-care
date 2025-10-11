import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModeToggle from './ModeToggle';
import ReminderForm from './ReminderForm';
import ReminderCard from './ReminderCard';
import LabelForm from './LabelForm';
import LabelCard from './LabelCard';
import { Reminder, Label } from '@shared/schema';
import { Bell, Tag, Loader2 } from 'lucide-react';

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState('reminders');

  const { data: reminders, isLoading: loadingReminders } = useQuery<Reminder[]>({
    queryKey: ['/api/reminders'],
  });

  const { data: labels, isLoading: loadingLabels } = useQuery<Label[]>({
    queryKey: ['/api/labels'],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mind Minder</h1>
              <p className="text-sm text-muted-foreground">Caregiver Dashboard</p>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reminders" className="gap-2" data-testid="tab-reminders">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="labels" className="gap-2" data-testid="tab-labels">
              <Tag className="h-4 w-4" />
              Labels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reminders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Reminder</CardTitle>
                <CardDescription>
                  Set up a reminder for tasks the elder needs to complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReminderForm />
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Active Reminders</h2>
              {loadingReminders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reminders && reminders.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reminders.filter(r => !r.completed).map((reminder) => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No active reminders yet</p>
                    <p className="text-sm text-muted-foreground">Create your first reminder above</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="labels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Label</CardTitle>
                <CardDescription>
                  Label objects or people with photos for recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LabelForm />
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-semibold mb-4">Saved Labels</h2>
              {loadingLabels ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : labels && labels.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {labels.map((label) => (
                    <LabelCard key={label.id} label={label} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Tag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No labels created yet</p>
                    <p className="text-sm text-muted-foreground">Create your first label above</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
