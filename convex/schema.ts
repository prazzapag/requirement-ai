import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  requirements: defineTable({
    userId: v.string(), //Clerk User Id
    fileName: v.string(),
    fileDisplayName: v.optional(v.string()),
    fileId: v.id("_storage"),
    uploadedAt: v.number(),
    size: v.number(),
    mimeType: v.string(),
    status: v.string(), // 'pending','processed','error'

    //Fields for extracted data
    companyName: v.optional(v.string()),
    requirementSummary: v.optional(v.string()),
    items: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        requirementType: v.string(), //'Functional','Non Functional'
        priority: v.string(),
        category: v.string(),
        source: v.string(),
        acceptance_criteria: v.string(),
        safetyRelevance: v.string(),
        requirementStatus: v.string(), //Draft
      }),
    ),
  }),
});
