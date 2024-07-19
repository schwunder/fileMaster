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

?
/*
export const fetchResults = internalQuery({
	args: { ids: v.array(v.id('meta')) },
	handler: async (ctx, args) => {
		const results = [];
		for (const id of args.ids) {
			const doc = await ctx.db.get(id);
			if (doc === null) {
				continue;
			}
			results.push(doc);
		}
		return results;
	}
});

export const similarTags = action({
	args: {
		descriptionEmbedding: v.array(v.number())
	},
	handler: async (ctx, args) => {
		// 1. Generate an embedding from your favorite third party API
		const embedding = args.descriptionEmbedding;

		// 2. Search for similar items using vector search
		const results = await ctx.vectorSearch('meta', 'by_embedding', {
			vector: embedding,
			limit: 16,
			filter: (q) => q.eq('type', 'art') // Assuming you want to filter by type "art"
		});

		// 3. Fetch the results
		const items = await ctx.runQuery(fetchResults, {
			ids: results.map((result) => result._id)
		});

		return items;
	}
});

*/