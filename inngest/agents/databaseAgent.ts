import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";
import { createAgent, createTool, openai } from "@inngest/agent-kit";
import * as z from "zod";
import { RequirementProcessingState } from "../networkstates";
import { client } from "@/lib/schematic";
const saveToDatabaseTool = createTool({
  name: "save-to-database",
  description: "Saves the given data to the convex database",
  parameters: z.object({
    fileDisplayName: z
      .string()
      .describe(
        "The readable display of the requirement to show in the UI. If the file name is not human readable,use this to give a more readable name",
      ),
    requirementId: z.string().describe("The ID of the requirement to update"),
    companyName: z
      .string()
      .describe(
        "If the company name is not human readable, try to find a company from the document",
      ),
    requirementSummary: z
      .string()
      .describe(
        "A summary of the requirement document, summarize in a few words what the requirement document focueses on.",
      ),
    items: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          requirementType: z.string(),
          priority: z.string(),
          category: z.string(),
          source: z.string(),
          acceptance_criteria: z.string(),
          safetyRelevance: z.string(),
          requirementStatus: z.string(),
        })
        .describe(
          "An array of all system requirements extracted from stakeholder requirements. Include title,short description,requirement type, safety relevance, and requirement status as draft for each system requirements.",
        ),
    ),
  }) as any,
  handler: async (params, context) => {
    const {
      fileDisplayName,
      requirementId,
      companyName,
      requirementSummary,
      items,
    } = params;

    const result = await context.step?.run(
      "save-requirement-to-database",
      async () => {
        try {
          // Call convex mutation
          const { userId } = await convex.mutation(
            api.requirements.updateRequirementWithExtractedData,
            {
              id: requirementId as Id<"requirements">,
              fileDisplayName,
              requirementSummary,
              items,
              companyName,
            },
          );
          await client.track({
            event: "scan",
            company: {
              id: userId,
            },
            user: {
              id: userId,
            },
          });
          return {
            addedToDb: "Success",
            requirementId,
            fileDisplayName,
            companyName,
            items,
            requirementSummary,
            userId,
            message: "Requirements successfully saved to database",
          };
        } catch (error) {
          console.error("Database save error ", error);
          return {
            addedToDb: "Failed",
            error: error instanceof Error ? error.message : "Unknown Error",
            requirementId,
          };
        }
      },
    );

    if (result?.addedToDb === "Success") {
      context.network.state.data = {
        ...context.network.state.data,
        savedToDatabase: true,
        requirementId: requirementId,
        processingComplete: true,
      } as RequirementProcessingState;

      return {
        ...result,
        completed: true,
        status: "Database operation completed successfully",
      };
    } else {
      context.network.state.data = {
        ...context.network.state.data,
        savedToDatabase: false,
        processingComplete: true,
      } as RequirementProcessingState;

      return {
        ...result,
        completed: false,
        status: "Database operation failed",
      };
    }
  },
});

export const databaseAgent = createAgent<RequirementProcessingState>({
  name: "Database Agent",
  description:
    "Responsible for taking key information regarding requirements and saving it to the convex database.",
  system: `You are a helpful assistant that takes key ingotmation regarding stakeholder requirements and save it to the convex database.When you successfully save data to the database, clearly indicate completion by including "successfully saved to database" in your response. This helps the system know when the process is complete.`,
  model: openai({
    model: "gpt-4o-mini",
    defaultParameters: {
      max_completion_tokens: 1000,
    },
  }),
  tools: [saveToDatabaseTool],
});
