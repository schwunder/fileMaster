import { z } from 'zod';

export const imageMetaSchema = z.object({
  type: z.string(),
  path: z.string(),
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
