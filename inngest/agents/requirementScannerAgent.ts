import { createAgent, createTool, anthropic, openai } from "@inngest/agent-kit";

import { z } from "zod";
import { RequirementProcessingState } from "../networkstates";

const parsePdfTool = createTool({
  name: "parse-pdf",
  description: "Analyse the given PDF",
  parameters: z.object({
    pdfUrl: z.string(),
  }) as any,
  handler: async ({ pdfUrl }, { step, network }) => {
    try {
      const result = await step?.ai.infer("parse-pdf", {
        model: anthropic({
          model: "claude-sonnet-5",
          defaultParameters: {
            max_tokens: 4096,
          },
        }) as any,
        body: {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "url",
                    url: pdfUrl,
                  },
                },
                {
                  type: "text",
                  text: `You are an expert requirements analyst. Extract and structure the requirements data from this PDF document.

**CRITICAL: Return ONLY valid JSON - no markdown, no explanations, just the JSON object.**

Extract the following information and format as JSON:

{
  "companyName":"Company Name Here",
  "requirementSummary": "Brief description of what this document covers and its main purpose",
  "items": [
    {
      "id": "REQ-001",
      "title": "Requirement Title",
      "description": "Detailed requirement description - what the system shall do",
      "safetyRelevance": "ASIL-A",
      "requirementType": "Functional",
      "priority": "High",
      "category": "Communication",
      "source": "Section reference if available",
      "acceptance_criteria": "How to verify this requirement is met",
      "requirementStatus":"draft"
    }
  ],
  "metadata": {
    "totalRequirements": 0,
    "safetyLevels": {
      "ASIL-A": 0,
      "ASIL-B": 0, 
      "ASIL-C": 0,
      "ASIL-D": 0,
      "QM": 0,
      "Not Specified": 0
    },
    "requirementTypes": {
      "Functional": 0,
      "Non-Functional": 0,
      "Safety": 0,
      "Performance": 0,
      "Interface": 0,
      "Design": 0
    }
  }
}

**Guidelines:**
- safetyRelevance: Use "ASIL-A", "ASIL-B", "ASIL-C", "ASIL-D", "QM", or "Not Specified"
- requirementType: Use "Functional", "Non-Functional", "Safety", "Performance", "Interface", "Design", or "Other"
- priority: Use "High", "Medium", "Low", or "Not Specified"
- Extract ALL requirements found in the document
- Maintain original requirement IDs when present
- If information is missing, use "Not Specified" or appropriate default
- Ensure all JSON strings are properly escaped
- Count totals accurately in metadata section`,
                },
              ],
            },
          ],
        },
      });

      const textBlock = result?.content?.find(
        (block: any): block is { type: "text"; text: string } =>
          block?.type === "text" && typeof block?.text === "string",
      );
      const rawText = textBlock?.text?.trim();

      if (!rawText) {
        const error = "PDF parsing returned no text content from the model";
        network.state.data = {
          ...network.state.data,
          error,
        } as RequirementProcessingState;
        throw new Error(error);
      }

      const jsonText = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "");
      try {
        JSON.parse(jsonText);
      } catch (parseError) {
        const error = `Failed to parse extracted PDF data as JSON: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`;
        network.state.data = {
          ...network.state.data,
          error,
        } as RequirementProcessingState;
        throw new Error(error);
      }

      network.state.data = {
        ...network.state.data,
        extractedData: jsonText,
      } as RequirementProcessingState;

      return {
        status: "success",
        message: "PDF parsed successfully and requirement data extracted.",
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});

export const requirementScannerAgent = createAgent<RequirementProcessingState>({
  name: "Requirement Scanning Agent",
  description: "Processes requirement pdfs to extract key info",
  system: `You are an AI - Powered Requirement Scanning assistant.Your primary role is to extract system requirements based on stakeholder requirements. Your tasks includes recognizing and parsing details such as: 
            . Company information : Stakeholder name
            . Requirement types: Functional / Non-Functional
            . Safety relevance : ASIL / QM 
            . System requirements based on the stakeholder requirements
            . Maintain a structured JSON output for easy integration with databases`,
  model: openai({
    model: "gpt-4o-mini",
    defaultParameters: {
      max_completion_tokens: 4096,
    },
  }) as any,
  tools: [parsePdfTool],
});
