import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@shared/schema';
import { Trash2, User, Package } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LabelCardProps {
  label: Label;
}

export default function LabelCard({ label }: LabelCardProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/labels/${label.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labels'] });
      toast({
        title: 'Label deleted',
        description: 'The label has been removed.',
      });
    },
  });

  return (
    <Card className="overflow-hidden" data-testid={`card-label-${label.id}`}>
      <div className="aspect-square relative bg-muted">
        <img 
          src={label.imageData} 
          alt={label.name}
          className="w-full h-full object-cover"
          data-testid="img-label"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1">
            {label.category === 'person' ? (
              <User className="h-3 w-3" />
            ) : (
              <Package className="h-3 w-3" />
            )}
            {label.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" data-testid="text-label-name">
              {label.name}
            </h3>
            {label.lastSeenAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Last seen: {new Date(label.lastSeenAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-label-${label.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
