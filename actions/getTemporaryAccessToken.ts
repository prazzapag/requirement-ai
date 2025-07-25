"use server";

import { currentUser } from "@clerk/nextjs/server";

import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY!;

//Get a temporary access token
export async function getTemporaryAccessToken() {
  const client = new SchematicClient({ apiKey });
  console.log("Getting temporary access token");
  const user = await currentUser();

  if (!user) {
    console.log("No user found,returning null");
    return null;
  }

  console.log(`Issuing temporary access token for user: ${user.id}`);

  const resp = await client.accesstokens.issueTemporaryAccessToken({
    lookup: { id: user.id },
  });

  console.log(
    "Token response received",
    resp.data ? "Token Received" : "No Token Received",
  );
  return resp.data?.token;
}
