import {
  anthropic,
  createNetwork,
  getDefaultRoutingAgent,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import Events from "./constants";
import { databaseAgent } from "./agents/databaseAgent";
import { requirementScannerAgent } from "./agents/requirementScannerAgent";
import { RequirementProcessingState } from "./networkstates";

const agentNetwork = createNetwork<RequirementProcessingState>({
  name: "Agent Team",
  agents: [databaseAgent, requirementScannerAgent],
  defaultModel: anthropic({
    model: "claude-sonnet-5",
    defaultParameters: {
      max_tokens: 1000,
    },
  }),
  defaultRouter: ({ network, callCount }) => {

    // if (callCount === 0){
    //   return requirementScannerAgent;
    // }

    // const isComplete =
    //   network.state.data.savedToDatabase ||
    //   network.state.data.processingComplete;
    // if (isComplete) {
    //   //Terminate the agent process if the data has been saved to the database
    //   return undefined;
    // }
    // // return getDefaultRoutingAgent();
    // return;

    const data = network.state.data;

    // 2. Strict terminal check
    const isComplete = data?.savedToDatabase === true || data?.processingComplete === true;
    if (isComplete) {
      return undefined;
    }

    // Terminate the run if a step reported an error instead of looping.
    if (data?.error) {
      return undefined;
    }

    // 3. Hand off to database agent once scanner populates the state data
    // (Ensure your scanner agent writes its findings to data.extractedData)
    if (data?.extractedData && !data?.savedToDatabase) {
      return databaseAgent;
    }

    // 4. Default starting point (or fallback to keep scanning if data isn't ready)
    return requirementScannerAgent;
  },
});

export const extractAndSavePdf = inngest.createFunction(
  {
    id: "Extract PDF and save in Database",
    triggers: [{ event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE }],
  },
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
