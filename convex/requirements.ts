import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

//Function to generate a Convex upload URL for the client
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    //Generate a URL that client can use to upload a file
    return await ctx.storage.generateUploadUrl();
  },
});

// Store a requirement file and add it to database
export const storeRequirement = mutation({
  args: {
    userId: v.string(),
    fileId: v.id("_storage"),
    fileName: v.string(),
    size: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    //Save the requirement to the database
    const requirementId = await ctx.db.insert("requirements", {
      userId: args.userId,
      fileName: args.fileName,
      fileId: args.fileId,
      uploadedAt: Date.now(),
      size: args.size,
      mimeType: args.mimeType,
      status: "pending",
      //Initialize extracted data fields
      companyName: undefined,
      items: [],
    });
    return requirementId;
  },
});

//Function to get all requirements
export const getRequirements = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requirements")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

//Function to get a single requirement by Id
export const getRequirementById = query({
  args: {
    id: v.id("requirements"),
  },
  handler: async (ctx, args) => {
    // Get the requirement
    const requirement = await ctx.db.get(args.id);

    //Verify user has access to this requirement
    if (requirement) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }

      const userId = identity.subject;
      if (requirement.userId !== userId) {
        throw new Error("Not authorized to access this requirement");
      }
    }
    return requirement;
  },
});

//Generate a URL to download a receipt file

export const getRequirementDownloadUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    //Get a temporary URL that can be used to download the file
    return await ctx.storage.getUrl(args.fileId);
  },
});

//Update the state of requirement
export const updateRequirementStatus = mutation({
  args: { id: v.id("requirements"), status: v.string() },
  handler: async (ctx, args) => {
    //Get the requirement
    const requirement = await ctx.db.get(args.id);
    if (!requirement) {
      throw new Error("Requirement not found");
    }
    //Verify user has access to this requirement
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not Authenticated");
    }

    const userId = identity.subject;
    if (requirement.userId !== userId) {
      throw new Error("Not authorized to update this requirement");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
    });
    return true;
  },
});

//Delete a requirement and its file
export const deleteRequirement = mutation({
  args: { id: v.id("requirements") },
  handler: async (ctx, args) => {
    const requirement = await ctx.db.get(args.id);

    if (!requirement) {
      throw new Error("Requirement not found.");
    }

    // //Verify user has access to this requirement
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not Authenticated");
    // }

    // const userId = identity.subject;
    // if (requirement.userId !== userId) {
    //   throw new Error("Not authorized to delete this requirement");
    // }

    //Delete the file from storage
    await ctx.storage.delete(requirement.fileId);

    //Delete the requirement record
    await ctx.db.delete(args.id);
    return true;
  },
});

//Update a requirement with extracted data
export const updateRequirementWithExtractedData = mutation({
  args: {
    id: v.id("requirements"),
    fileDisplayName: v.string(),
    requirementSummary: v.string(),
    companyName: v.string(),
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
        requirementStatus: v.string(), //Draft //Draft
      }),
    ),
  },
  handler: async (ctx, args) => {
    //Verify requirement exists
    const requirement = await ctx.db.get(args.id);

    if (!requirement) {
      throw new Error("Requirement not found");
    }

    //Update the requirement with the extracted data
    await ctx.db.patch(args.id, {
      fileDisplayName: args.fileDisplayName,
      requirementSummary: args.requirementSummary,
      companyName: args.companyName,
      items: args.items,
      status: "processed",
    });

    return {
      userId: requirement.userId,
    };
  },
});
