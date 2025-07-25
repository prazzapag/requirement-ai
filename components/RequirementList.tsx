"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

function RequirementList() {
  const { user } = useUser();
  const requirements = useQuery(api.requirements.getRequirements, {
    userId: user?.id || "",
  });
  const router = useRouter();

  if (!user) {
    return (
      <div className="w-full p-8 text-center">
        <p className="text-gray-600">
          Please sign in to view your requirements
        </p>
      </div>
    );
  }

  if (!requirements) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
        <p className="text-gray-600">Loading Requirements...</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="w-full p-8 border border-gray-200 rounded-lg bg-gray-500">
        <p className="text-gray-600">No requirements have been uploaded yet</p>
      </div>
    );
  }
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Your Requirements</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.map((requirement: Doc<"requirements">) => (
              <TableRow
                key={requirement._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/requirement/${requirement._id}`)}
              >
                <TableCell className="py-2">
                  <FileText className="h-6 w-6 text-red-500" />
                </TableCell>
                <TableCell className="font-medium ">
                  {requirement.fileDisplayName || requirement.fileName}
                </TableCell>
                <TableCell>
                  {new Date(requirement.uploadedAt).toLocaleString()}
                </TableCell>
                <TableCell>{formatFileSize(requirement.size)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${requirement.status === "pending" ? "bg-yellow-100 text-yellow-800" : requirement.status === "processed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {requirement.status.charAt(0).toUpperCase() +
                      requirement.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
export default RequirementList;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
