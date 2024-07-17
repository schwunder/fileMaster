import { z } from 'zod';

export const imageMetaSchema = z.object({
	type: z.string(),
	path: z.string(),
	title: z.string(),
	description: z.string(),
	tags: z.array(z.string()),
	matchingTags: z.array(z.string()),
	embedding: z.array(z.number())
});

export type imageMeta = z.infer<typeof imageMetaSchema>;
