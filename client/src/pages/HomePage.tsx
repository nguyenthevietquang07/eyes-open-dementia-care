import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import CaregiverDashboard from '@/components/CaregiverDashboard';
import ElderView from '@/components/ElderView';
import AuthPage from './AuthPage';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { mode } = useMode();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (mode === 'elder') {
    return <ElderView />;
  }

  return <CaregiverDashboard />;
}
