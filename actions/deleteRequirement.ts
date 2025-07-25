"use server";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";

/**
 * Server action to delete a receipt
 */

export async function deleteRequirement(requirementId: string) {
  try {
    await convex.mutation(api.requirements.deleteRequirement, {
      id: requirementId as Id<"requirements">,
    });
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting requirement: ", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "And unknown error occured",
    };
  }
}
