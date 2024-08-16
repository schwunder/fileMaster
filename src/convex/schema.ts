import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  meta: defineTable({
    type: v.string(),
    originalPath: v.string(),
    convertedPath: v.string(),
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    matching: v.array(v.string()),
    embedding: v.array(v.float64()),
    processed: v.number(), // Changed from boolean to number
  }).vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 1536,
  }),
});

// TODO: add a table for deleted images with reference to the original image and the date of deletion and the reason for deletion
// reason for deletion could be:
// - user deleted the image
// - image was too similar to another image
// - image was too small
// - image was too large
// - image was too blurry
// - image was too dark
// - image was too bright
// - image was too colorful
// - image was too boring
// - image was too similar to a meta image
// - image was too similar to a matching image
// - image was too similar to a tag image
// - image was too similar to a description image
// - image was too similar to a title image
// - image was too similar to a matching image
// - image was too similar to a matching image
// - multiple choice in the ui
