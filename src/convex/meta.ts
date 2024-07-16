import { mutation, query } from './_generated/server';

import { v } from 'convex/values';

export const get = query(async (ctx) => {
	console.log('Write and test your query function here!');
	return await ctx.db.query('meta').take(10);
});

export const getAll = query(async ({ db }) => {
	console.log('Fetching all images from the database');
	const images = await db.query('meta').collect();
	console.log('Fetched images:', images);
	return images;
});

export const addMeta = mutation({
	args: { path: v.string(), type: v.string() },
	handler: async (ctx, { path, type }) => {
		const newTaskId = await ctx.db.insert('meta', { path, type });
		return newTaskId;
	}
});

export const deleteMeta = mutation({
	args: { id: v.id('meta') },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	}
});
