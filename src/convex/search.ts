import { v } from 'convex/values';
import { action, internalQuery } from './_generated/server';
import { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';

export const fetchResults = internalQuery({
	args: { ids: v.array(v.id('meta')) },
	handler: async (ctx, args) => {
		const results: Doc<'meta'>[] = [];
		for (const id of args.ids) {
			const doc = await ctx.db.get(id);
			if (doc !== null) {
				results.push(doc);
			}
		}
		return results;
	}
});

export const similarEmbeddings = action({
	args: {
		embedding: v.array(v.float64())
	},
	handler: async (ctx, args): Promise<Doc<'meta'>[]> => {
		const results = await ctx.vectorSearch('meta', 'by_embedding', {
			vector: args.embedding,
			limit: 16
		});

		const meta = await ctx.runQuery(internal.search.fetchResults, {
			ids: results.map((result) => result._id)
		});

		return meta;
	}
});
