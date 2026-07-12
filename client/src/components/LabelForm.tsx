import { useState, useRef, useEffect, type ChangeEvent } from 'react';
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

const MAX_IMAGE_SIDE = 1280;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file.');
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read the selected image.'));
      img.src = sourceUrl;
    });

    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image processing is not available in this browser.');
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

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
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create label. Please try again.',
        variant: 'destructive',
      });
    },
  });

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageData = await compressImage(file);
        setPreview(imageData);
        form.setValue('imageData', imageData, { shouldValidate: true });
      } catch (error) {
        toast({
          title: 'Image upload failed',
          description: error instanceof Error ? error.message : 'Please choose a smaller image.',
          variant: 'destructive',
        });
        setPreview(null);
        form.setValue('imageData', '');
      }
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
                    {detectedObjects.map((obj, idx) => (
                      <Badge 
                        key={obj} 
                        variant="secondary"
                        data-testid={`badge-detected-object-${idx}`}
                      >
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
