import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	meta: defineTable({
		type: v.string(),
		path: v.string(),
		title: v.string(),
		description: v.string(),
		tags: v.array(v.string()),
		matching: v.array(v.string()),
		embedding: v.array(v.float64())
	}).vectorIndex('by_embedding', {
		vectorField: 'embedding',
		dimensions: 1536
	})
});
