"use server";

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server";
import { getFileDownloadUrl } from "./getFileDownloadUrl";
import { inngest } from "@/inngest/client";
import Events from "@/inngest/constants";

/**
 * Server action to upload the PDF file to Convex storage
 */
export async function uploadPDF(formData: FormData) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Not Authenticated" };
  }

  try {
    //Get the file from the form data
    const file = formData.get("file") as File;
    // If no file, return error
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return { success: false, error: "Only PDF files are allowed" };
    }

    //Get upload URL from convex
    const uploadUrl = await convex.mutation(
      api.requirements.generateUploadUrl,
      {},
    );

    //Convert the file to arrayBuffer for fetch API
    const arrayBuffer = await file.arrayBuffer();

    //Upload the file to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file : ${uploadResponse.statusText}`);
    }

    //Get storage ID from the response
    const { storageId } = await uploadResponse.json();

    // Add requirement to the database
    const requirementId = await convex.mutation(
      api.requirements.storeRequirement,
      {
        userId: user.id,
        fileId: storageId,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      },
    );

    //Generate the file URL
    const fileUrl = await getFileDownloadUrl(storageId);

    // Trigger inngest flow

    await inngest.send({
      name: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE,
      data: {
        url: fileUrl,
        requirementId,
      },
    });

    return {
      success: true,
      data: {
        requirementId,
        filename: file.name,
      },
    };
  } catch (error) {
    console.error("Server action upload error: ", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occured.",
    };
  }
}
