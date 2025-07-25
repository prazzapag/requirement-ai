/**
 * Server action to get a download URL for a file in Convex storage
 */

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";

export async function getFileDownloadUrl(fileId: Id<"_storage"> | string) {
  try {
    //Get the dowload Url from Convex
    const downloadUrl = await convex.query(
      api.requirements.getRequirementDownloadUrl,
      { fileId: fileId as Id<"_storage"> },
    );

    if (!downloadUrl) {
      throw new Error("Could not generate download Url");
    }
    return downloadUrl;
  } catch (error) {
    console.error("Error generating download Url: ", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occured",
    };
  }
}
