import { useMode } from '@/contexts/ModeContext';
import CaregiverDashboard from '@/components/CaregiverDashboard';
import ElderView from '@/components/ElderView';

export default function HomePage() {
  const { mode } = useMode();

  if (mode === 'elder') {
    return <ElderView />;
  }

  return <CaregiverDashboard />;
}
