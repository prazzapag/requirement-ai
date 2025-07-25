import {
  anthropic,
  createNetwork,
  getDefaultRoutingAgent,
} from "@inngest/agent-kit";
import { createServer } from "@inngest/agent-kit/server";
import { inngest } from "./client";
import Events from "./constants";
import { databaseAgent } from "./agents/databaseAgent";
import { requirementScannerAgent } from "./agents/requirementScannerAgent";
import { RequirementProcessingState } from "./networkstates";

const agentNetwork = createNetwork<RequirementProcessingState>({
  name: "Agent Team",
  agents: [databaseAgent, requirementScannerAgent],
  defaultModel: anthropic({
    model: "claude-3-5-sonnet-latest",
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
  defaultRouter: ({ network }) => {
    const isComplete =
      network.state.data.savedToDatabase ||
      network.state.data.processingComplete;
    if (isComplete) {
      //Terminate the agent process if the data has been saved to the database
      return undefined;
    }
    return getDefaultRoutingAgent();
  },
});

export const server = createServer({
  agents: [databaseAgent, requirementScannerAgent],
  networks: [agentNetwork],
});

export const extractAndSavePdf = inngest.createFunction(
  {
    id: "Extract PDF and save in Database",
  },
  { event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE },
  async ({ event }) => {
    const result = await agentNetwork.run(
      `You are an expert systems requirement analyser in an automotive industry responsible for extracting system requirements from a stakeholder requirement. Extract the key data like the requirement, requirement type, safety relevance from this pdf:${event.data.url}. Once the data is extracted, save it to the database using the requirementId:${event.data.requirementId}. Once the requirement is successfully saved to the database, you can terminate the agent process.`,
    );

    console.log(result);
    return {
      success: result.state.data.savedToDatabase,
      requirementId: result.state.data.requirementId,
      extractedData: result.state.data.extractedData,
      error: result.state.data.error,
    };
    // return result.state.kv.get("requirement");
  },
);
