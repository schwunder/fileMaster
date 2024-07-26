import { mutation, query } from './_generated/server';

import { v } from 'convex/values';

export const getById = query({
	args: { id: v.id('meta') },
	handler: async (ctx, args) => {
		const meta = await ctx.db.get(args.id);
		return meta;
	}
});

export const getByIdArray = query({
	args: { ids: v.array(v.id('meta')) },
	handler: async (ctx, args) => {
		const metas = [];
		for (const id of args.ids) {
			metas.push(ctx.db.get(id));
		}
		return Promise.all(metas);
	}
	// await ctx.db.query('meta').withIndex('by_id', ids).collect();
});

export const getAll = query(async ({ db }) => {
	console.log('Fetching all images from the database');
	const images = await db.query('meta').collect();
	console.log('Fetched images:', images);
	return images;
});

export const addMeta = mutation({
	args: {
		path: v.string(),
		type: v.string(),
		title: v.string(),
		description: v.string(),
		tags: v.array(v.string()),
		matching: v.array(v.string()), // Changed from matchingTags to matching
		embedding: v.array(v.number())
	},
	handler: async (ctx, { path, type, title, description, tags, matching, embedding }) => {
		const newTaskId = await ctx.db.insert('meta', {
			path,
			type,
			title,
			description,
			tags,
			matching, // Changed from matchingTags to matching
			embedding
		});
		return newTaskId;
	}
});

export const updateMeta = mutation({
	args: {
		id: v.id('meta'),
		path: v.optional(v.string()),
		type: v.optional(v.string()),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		matching: v.optional(v.array(v.string())),
		embedding: v.optional(v.array(v.number()))
	},
	handler: async (ctx, args) => {
		const { id, ...updateFields } = args;

		await ctx.db.patch(id, updateFields);
	}
});

export const deleteMeta = mutation({
	args: { id: v.id('meta') },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	}
});
