import {
  MessageActivityInput,
  stripMentionsText,
  TokenCredentials,
} from "@microsoft/teams.api";
import { App } from "@microsoft/teams.apps";
import { LocalStorage } from "@microsoft/teams.common";
import config from "./config";
import { ManagedIdentityCredential } from "@azure/identity";
import { getAIReply } from "./ai";
import { dashboardCard, DASHBOARD_URL } from "./cards";
import { getRoster, mentionableNames, toMentionMessage } from "./mentions";

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

// Greet on install so the dashboard button is reachable without typing anything.
app.on("install.add", async (context) => {
  await context.send(
    new MessageActivityInput().addCard(
      "adaptive",
      dashboardCard(
        "👋 Engineering Operations Copilot",
        "I help you find the right expert, search past issues and raise incidents — without leaving Teams.",
      ),
    ),
  );
});

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
    await context.send(
      new MessageActivityInput().addCard(
        "adaptive",
        dashboardCard(
          "🤖 Engineering Operations Copilot",
          "Ask in plain language — you don't need exact commands.",
        ),
      ),
    );
    return;
  }

  // Diagnostic: show who this conversation lets us tag, and tag them.
  // Nothing is mentionable in a 1:1 chat except you, so use a group chat
  // or channel to see real mentions.
  if (text === "/tag") {
    const roster = await getRoster(context);
    if (roster.length === 0) {
      await context.send(
        "I couldn't read this conversation's roster, so I can't tag anyone here.",
      );
      return;
    }
    const list = roster.map((m) => `- <at>${m.name}</at>`).join("\n");
    await context.send(
      toMentionMessage(
        `I can tag ${roster.length} ${roster.length === 1 ? "person" : "people"} here:\n${list}`,
        roster,
      ),
    );
    return;
  }

  if (text === "/dashboard") {
    await context.send(
      new MessageActivityInput(
        `📊 Operations dashboard: ${DASHBOARD_URL}`,
      ).addCard(
        "adaptive",
        dashboardCard(
          "📊 Operations dashboard",
          "Open incidents, the expert directory, knowledge articles and the roadmap.",
        ),
      ),
    );
    return;
  }

  // Everything else (greetings, "who knows X", incident search, raise incident, etc.)
  // is handled by Gemini, which calls the real find_expert / search_incidents /
  // raise_incident tools backed by our own API (see bot/tools.ts, bot/ai.ts).
  try {
    // The roster decides who can actually be tagged: we tell the model which
    // names are taggable, then turn the <at> markers it emits into real
    // mention entities. Names outside the roster degrade to plain text.
    const roster = await getRoster(context);
    const { text: aiReply, directory } = await getAIReply(
      text,
      mentionableNames(roster),
    );
    await context.send(toMentionMessage(aiReply, roster, directory));
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
