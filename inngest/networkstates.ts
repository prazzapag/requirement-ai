import { createState } from "@inngest/agent-kit";

export interface RequirementProcessingState {
  savedToDatabase: boolean;
  requirementId?: string;
  extractedData?: string;
  processingComplete?: boolean;
  error?: string;
}
