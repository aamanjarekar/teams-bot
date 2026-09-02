import { stripMentionsText, TokenCredentials } from "@microsoft/teams.api";
import { App } from "@microsoft/teams.apps";
import { LocalStorage } from "@microsoft/teams.common";
import config from "./config";
import { ManagedIdentityCredential } from "@azure/identity";
import { getAIReply } from "./ai";

// Create storage for conversation history
const storage = new LocalStorage();

const createTokenFactory = () => {
  return async (
    scope: string | string[],
    tenantId?: string,
  ): Promise<string> => {
    const managedIdentityCredential = new ManagedIdentityCredential({
      clientId: process.env.CLIENT_ID,
    });
    const scopes = Array.isArray(scope) ? scope : [scope];
    const tokenResponse = await managedIdentityCredential.getToken(scopes, {
      tenantId: tenantId,
    });

    return tokenResponse.token;
  };
};

// Configure authentication using TokenCredentials
const tokenCredentials: TokenCredentials = {
  clientId: process.env.CLIENT_ID || "",
  token: createTokenFactory(),
};

const credentialOptions =
  config.MicrosoftAppType === "UserAssignedMsi"
    ? { ...tokenCredentials }
    : undefined;

// Create the app with storage
const app = new App({
  ...credentialOptions,
  storage,
  skipAuth: !process.env.CLIENT_ID,
});

// Interface for conversation state
interface ConversationState {
  count: number;
}

const getConversationState = (conversationId: string): ConversationState => {
  let state = storage.get(conversationId);
  if (!state) {
    state = { count: 0 };
    storage.set(conversationId, state);
  }
  return state;
};

app.on("message", async (context) => {
  const activity = context.activity;
  const text: string = stripMentionsText(activity);

  if (text === "/reset") {
    storage.delete(activity.conversation.id);
    await context.send("Ok I've deleted the current conversation state.");
    return;
  }

  if (text === "/count") {
    const state = getConversationState(activity.conversation.id);
    await context.send(`The count is ${state.count}`);
    return;
  }

  if (text === "/diag") {
    await context.send(JSON.stringify(activity));
    return;
  }

  if (text === "/state") {
    const state = getConversationState(activity.conversation.id);
    await context.send(JSON.stringify(state));
    return;
  }

  if (text === "/runtime") {
    const runtime = {
      nodeversion: process.version,
      sdkversion: "2.0.0", // Microsoft Teams SDK
    };
    await context.send(JSON.stringify(runtime));
    return;
  }

  if (text === "/help") {
    await context.send(`
🤖 Engineering Operations Copilot

Available skills

👤 Find Experts
📚 Search Knowledge
🚨 Raise Incident
📈 System Status
🚀 Release Information
      `);
    return;
  }

  // Everything else (greetings, "who knows X", incident search, raise incident, etc.)
  // is handled by Gemini, which calls the real find_expert / search_incidents /
  // raise_incident tools backed by our own API (see bot/tools.ts, bot/ai.ts).
  try {
    const aiReply = await getAIReply(text);
    await context.send(aiReply);
  } catch (error) {
    console.error("Error calling Gemini:", error);

    await context.send(`
  ⚠️ I'm having trouble reaching the AI service right now, so I can't answer that at the moment.

Here's what I can normally help with:

👤 **Find an Expert** — e.g. "who knows erp"
📚 **Search Previous Issues** — e.g. "booking validation failed"
🚨 **Raise an Incident** — e.g. "raise incident"

Please try again in a moment.
  `);
  }
});

export default app;
