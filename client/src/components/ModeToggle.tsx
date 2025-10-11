import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { User, Camera } from 'lucide-react';

export default function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <Button
      size="lg"
      variant="default"
      onClick={() => setMode(mode === 'caregiver' ? 'elder' : 'caregiver')}
      className="gap-2 font-semibold"
      data-testid="button-mode-toggle"
    >
      {mode === 'caregiver' ? (
        <>
          <Camera className="h-5 w-5" />
          Switch to Elder Mode
        </>
      ) : (
        <>
          <User className="h-5 w-5" />
          Switch to Caregiver Mode
        </>
      )}
    </Button>
  );
}
