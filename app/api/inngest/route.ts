import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { extractAndSavePdf } from "@/inngest/agent";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractAndSavePdf],
});
