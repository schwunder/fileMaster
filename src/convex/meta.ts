import { truncateLog } from './../lib/utilities/string';
import { mutation, query } from './_generated/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  meta: defineTable({
    originalPath: v.string(),
    convertedPath: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    matching: v.array(v.string()),
    embedding: v.array(v.number()),
    processed: v.number(),
  }),
});

export const deleteAllMeta = mutation({
  handler: async (ctx) => {
    const allMeta = await ctx.db.query('meta').collect();
    for (const meta of allMeta) {
      await ctx.db.delete(meta._id);
    }
  },
});

export const getById = query({
  args: { id: v.id('meta') },
  handler: async (ctx, args) => {
    const meta = await ctx.db.get(args.id);
    return meta;
  },
});

export const getByIdArray = query({
  args: { ids: v.array(v.id('meta')) },
  handler: async (ctx, args) => {
    const metas = [];
    for (const id of args.ids) {
      metas.push(ctx.db.get(id));
    }
    return Promise.all(metas);
  },
  // await ctx.db.query('meta').withIndex('by_id', ids).collect();
});

// In your Convex query file (e.g., meta.ts)
export const getAll = query(async ({ db }) => {
  console.log('Fetching all images from the database');
  const images = await db.query('meta').collect();
  console.log('Fetched images:', truncateLog(JSON.stringify(images)));
  return images;
});

export const getAllPaths = query(async ({ db }) => {
  console.log('Fetching all image paths from the database');
  const images = await db.query('meta').collect();
  const paths = images.map((img) => img.originalPath);
  console.log('Fetched image paths:', paths);
  return paths;
});

export const getAllTags = query(async ({ db }) => {
  const tags = await db.query('meta').collect();
  const uniqueTags = [...new Set(tags.map((tag) => tag.tags).flat())];
  return uniqueTags;
});

export const getPathWithCorrespondingTags = query(async ({ db }) => {
  const metas = await db.query('meta').collect();
  const pathsWithTags = metas.map((meta) => ({
    path: meta.originalPath,
    tags: meta.tags,
  }));
  return pathsWithTags;
});

export const getNewPaths = query({
  args: { scannedPaths: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existingImages = await ctx.db.query('meta').collect();
    const existingPathSet = new Set(
      existingImages.map((img) => img.originalPath)
    );

    const newPaths = args.scannedPaths.filter(
      (path) => !existingPathSet.has(path)
    );

    console.log('New paths to process:', newPaths);
    return newPaths;
  },
});

export const addMeta = mutation({
  args: {
    originalPath: v.string(),
    convertedPath: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    matching: v.array(v.string()),
    embedding: v.array(v.number()),
    processed: v.number(),
  },
  handler: async (ctx, args) => {
    const newTaskId = await ctx.db.insert('meta', args);
    return newTaskId;
  },
});

export const updateMeta = mutation({
  args: {
    id: v.id('meta'),
    originalPath: v.optional(v.string()),
    convertedPath: v.optional(v.string()),
    type: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    matching: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.number())),
    processed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    await ctx.db.patch(id, updateFields);
  },
});

export const deleteMeta = mutation({
  args: { id: v.id('meta') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const incrementProcessed = mutation({
  args: { id: v.id('meta') },
  handler: async (ctx, args) => {
    const meta = await ctx.db.get(args.id);
    if (meta) {
      await ctx.db.patch(args.id, {
        processed: (meta.processed as number) + 1,
      });
    }
  },
});

export const getAllEmbeddings = query(async ({ db }) => {
  console.log('Fetching all embeddings from the database');
  const metas = await db.query('meta').collect();
  const embeddings = metas.map((meta) => meta.embedding);
  console.log('Fetched embeddings:', truncateLog(JSON.stringify(embeddings)));
  return embeddings;
});
