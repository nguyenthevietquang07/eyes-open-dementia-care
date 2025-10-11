import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { insertLabelSchema, type InsertLabel } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useDetectedObjects } from '@/hooks/useDetectedObjects';
import { Camera, Plus, Upload, Loader2 } from 'lucide-react';

export default function LabelForm() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { objects: detectedObjects, isLoading: detectingObjects } = useDetectedObjects(preview || '');

  const form = useForm<InsertLabel>({
    resolver: zodResolver(insertLabelSchema),
    defaultValues: {
      name: '',
      category: 'object',
      imageData: '',
      detectedObjects: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLabel) => apiRequest('POST', '/api/labels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labels'] });
      toast({
        title: 'Label created',
        description: 'The label has been successfully created.',
      });
      form.reset();
      setPreview(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create label. Please try again.',
        variant: 'destructive',
      });
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        form.setValue('imageData', base64);
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    if (detectedObjects.length > 0) {
      form.setValue('detectedObjects', detectedObjects);
    }
  }, [detectedObjects, form]);

  function onSubmit(values: InsertLabel) {
    if (!values.imageData) {
      toast({
        title: 'Image required',
        description: 'Please upload an image for the label.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Grandma Sarah, Kitchen Table" 
                  {...field} 
                  data-testid="input-label-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-label-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Photo</FormLabel>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-photo"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              data-testid="input-file-upload"
            />
          </div>
          {preview && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                  data-testid="img-label-preview"
                />
              </div>
              {detectingObjects ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detecting objects...
                </div>
              ) : detectedObjects.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detected objects:</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedObjects.map((obj) => (
                      <Badge key={obj} variant="secondary">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gap-2" 
          disabled={createMutation.isPending}
          data-testid="button-create-label"
        >
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? 'Creating...' : 'Create Label'}
        </Button>
      </form>
    </Form>
  );
}
