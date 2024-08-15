import { z } from 'zod';

export const imageMetaSchema = z.object({
  type: z.string(),
  originalPath: z.string(),
  convertedPath: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  matching: z.array(z.string()),
  embedding: z.array(z.number()),
  processed: z.number(),
});

export type imageMeta = z.infer<typeof imageMetaSchema>;

export const formSchema = z.object({
  folderPath: z.string().min(2).max(50),
});

export type FormSchema = z.infer<typeof formSchema>;

export const sampleTags: string[] = [
  'screenshot',
  'passport',
  'document',
  'bill',
  'family',
  'city',
  'vacation',
  'landscape',
  'pet',
  'art',
  'male',
  'female',
  'selfie',
  'friends',
  'home',
  'work',
  'event',
  'party',
  'food',
  'drink',
  'travel',
  'nature',
  'birthday',
  'wedding',
  'celebration',
  'holiday',
  'baby',
  'school',
  'fitness',
  'documentary',
];
