"use client";

import { getFileDownloadUrl } from "@/actions/getFileDownloadUrl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { useSchematicFlag } from "@schematichq/schematic-react";
import { useQuery } from "convex/react";
import { ChevronLeft, FileText, Lightbulb, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteRequirement } from "@/actions/deleteRequirement";

function Requirement() {
  const params = useParams<{ id: string }>();
  const [requirementId, setRequirementId] = useState<Id<"requirements"> | null>(
    null,
  );
  const router = useRouter();
  const isSummariesEnabled = useSchematicFlag("summary");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);

  //Fetch requirement Details
  const requirement = useQuery(
    api.requirements.getRequirementById,
    requirementId ? { id: requirementId } : "skip",
  );

  //Get file download URL for the view button
  const fileId = requirement?.fileId;

  const downloadUrl = useQuery(
    api.requirements.getRequirementDownloadUrl,
    fileId ? { fileId } : "skip",
  );

  //function to handle downloading the pdf

  const handleDownload = async () => {
    if (!requirement || !requirement.fileId) return;

    try {
      setIsLoadingDownload(true);
      const result = await getFileDownloadUrl(requirement.fileId);

      if (typeof result !== "string" && result.error) {
        throw new Error(result.error);
      }

      //Create a temporary link and trigger download
      const link = document.createElement("a");
      if (typeof result === "string") {
        link.href = result;
        link.download = requirement.fileName || "requirement.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error("No download URL found");
      }
    } catch (error) {
      console.error("Error downloading file: ", error);
      alert("Failed to download the file, please try again");
    } finally {
      setIsLoadingDownload(false);
    }
  };

  const handleDeleteRequirement = async () => {
    if (!requirementId) return;

    if (window.confirm("Are you sure? This cannot be undone")) {
      try {
        setIsDeleting(true);

        const result = await deleteRequirement(requirementId);

        if (!result?.success) {
          throw new Error(result?.error);
        }
        router.push("/requirements");
      } catch (error) {
        console.error("Error deleting requirement:", error);
        alert("Failed to delete the requirement. Please try again.");
        setIsDeleting(false);
      }
    }
  };

  useEffect(() => {
    try {
      const id = params.id as Id<"requirements">;
      setRequirementId(id);
    } catch (error) {
      console.error("Invalid Requirement Id", error);
      router.push("/");
    }
  }, [params.id, router]);

  //Loading...
  if (requirement === undefined) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
        </div>
      </div>
    );
  }

  if (requirement === null) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Requirement not found</h1>
          <p>
            The requirement you&apos;re looking for doesn&apos;t exists or has
            been removed.
          </p>
          <Link
            href={"/"}
            className="px-6 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  //Format upload date
  const uploadDate = new Date(requirement.uploadedAt).toLocaleString();

  //Check if requirement has extracted data
  const hasExtractedData = !!(
    requirement.companyName || requirement.requirementSummary
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <nav>
          <Link
            href={"/requirements"}
            className="text-violet-500 hover:underline flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Requirements
          </Link>
        </nav>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {requirement.fileDisplayName || requirement.fileName}
              </h1>
              <div className="flex items-center">
                {requirement.status === "pending" ? (
                  <div className="mr-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800"></div>
                  </div>
                ) : null}
                <span
                  className={`px-3 py-1 rounded-full text-sm ${requirement.status === "pending" ? "bg-yellow-100 text-yellow-800" : requirement.status === "processed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {requirement.status.charAt(0).toUpperCase() +
                    requirement.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/**Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    File Information
                  </h3>
                  <div className="mt-2 bg-gray-50 p-4 rounnded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Uploaded</p>
                        <p className="font-medium">{uploadDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Size</p>
                        <p className="font-medium">
                          {formatFileSize(requirement.size)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium">{requirement.mimeType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ID</p>
                        <p
                          className="font-medium truncate"
                          title={requirement._id}
                        >
                          {requirement._id.slice(0, 10)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/**Download */}
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-violet-500 mx-auto" />
                  <p className="mt-4 text-sm text-gray-500"> PDF Preview</p>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target={"_blank"}
                      rel="noopener noreferer"
                      className="mt-4 px-4 py-2 bg-violet-500 text-white text-sm rounded hover:bg-violet-600 inline-block"
                    >
                      View PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
            {/**Extracted Data */}
            {hasExtractedData && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Requirement Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/**Company Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Company Information
                    </h4>
                    <div className="space-y-2">
                      {requirement.companyName && (
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">
                            {requirement.companyName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/**Transaction Details */}
                </div>
                {/**Requirement Summary */}
                {requirement.requirementSummary && (
                  <>
                    {isSummariesEnabled ? (
                      <div className="p-4 mt-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100 shadow-sm">
                        <div className="flex items-center mb-4">
                          <h4 className="font-semibold text-violet-700">
                            AI Summary
                          </h4>
                          <div className="ml-2 flex">
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                            <Sparkles className="h-3 w-3 text-yellow-500 -ml-1" />
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-violet-100">
                          <p className="text-sm whitespace-pre-line leading-relaxed text-gray-700">
                            {requirement.requirementSummary}
                          </p>
                        </div>
                        <div className="mt-3 text-xs text-violet-600 italic flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          <span>
                            AI-generated summary based on stakeholder
                            requirement
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 mt-6 bg-gray-100 border border-gray-400  shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <h4 className="font-semibold text-violet-700">
                              AI Summary
                            </h4>
                            <div className="ml-2 flex">
                              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                              <Sparkles className="h-3 w-3 text-yellow-500 -ml-1" />
                            </div>
                          </div>
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="bg-white bg-opacity-50 rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center">
                          <Link
                            href={"/manage-plan"}
                            className="text-center py-4"
                          >
                            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-2">
                              AI Summary is a PRO level feature.
                            </p>
                            <button className="mt-2 px-4 py-3.5 bg-violet-500 text-white text-sm rounded hover:bg-violet-600 inline-block">
                              Upgrade to Unlock
                            </button>
                          </Link>
                        </div>

                        <div className="mt-3 text-xs text-grey-400 italic flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          <span>
                            Get AI-powered insights from your requirements.
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/**Items section */}
                {requirement.items && requirement.items.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Items ({requirement.items.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Safety Relevance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Acceptance Criteria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requirement.items.map((req, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {req.title}
                              </TableCell>
                              <TableCell>{req.priority}</TableCell>
                              <TableCell className="text-wrap">
                                {req.description}
                              </TableCell>
                              <TableCell>{req.category}</TableCell>
                              <TableCell>{req.requirementType}</TableCell>
                              <TableCell>{req.safetyRelevance}</TableCell>
                              <TableCell>{req.requirementStatus}</TableCell>
                              <TableCell>{req.acceptance_criteria}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/**End of extracted Data Section */}
            {/**Action Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  className={`px-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 ${isLoadingDownload ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                  onClick={handleDownload}
                  disabled={isLoadingDownload || !fileId}
                >
                  {isLoadingDownload ? "Downloading..." : "Download PDF"}
                </button>
                <button
                  className={`px-4 py-2 rounded text-sm ${isDeleting ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-50 border-red-500 text-red-600 hover:bg-red-10"}`}
                  onClick={handleDeleteRequirement}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Requirement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Requirement;
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
