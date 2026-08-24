import { stripMentionsText, TokenCredentials } from "@microsoft/teams.api";
import { App } from "@microsoft/teams.apps";
import { LocalStorage } from "@microsoft/teams.common";
import config from "./config";
import { ManagedIdentityCredential } from "@azure/identity";

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

  const message = text.toLowerCase();

  // Expert Finder
  if (message.startsWith("who knows")) {
    const topic = message.replace("who knows", "").trim();

    const experts: Record<string, string> = {
      erp: `
🔍 **Expert Finder**

Topic: ERP

⭐ **Alice Johnson**
ERP Lead
• 18 issues resolved
• Last active: Today

⭐ **Bob Smith**
Booking API
• 12 issues resolved
• Last active: Yesterday

⭐ **Charlie Brown**
Integration Specialist
• 9 issues resolved

💬 Suggested action:
Start a discussion with Alice.
`,

      spektrum: `
🔍 **Expert Finder**

Topic: Spektrum

⭐ **Sarah Chen**
Product Owner
• 24 issues resolved

⭐ **John Smith**
Senior Developer
• 17 issues resolved

⭐ **Mike Wilson**
Support Engineer
• 9 issues resolved

💬 Suggested action:
Start a discussion with Sarah.
`,

      azure: `
🔍 **Expert Finder**

Topic: Azure

⭐ **David Wilson**
Cloud Architect

⭐ **Emma Johnson**
Platform Engineer

⭐ **Chris Brown**
DevOps Engineer

💬 Suggested action:
Start a discussion with David.
`,
    };

    await context.send(
      experts[topic] ??
        `🔍 I couldn't find any registered experts for **${topic}**.

Would you like to:
• Raise a support request
• Search the knowledge base`,
    );

    return;
  }

  // Booking
  if (message.includes("booking")) {
    await context.send(`
  # 📦 Booking Validation Issue

  I found **3 similar incidents**.

  ### Most likely cause
  A missing BookingConfig after a deployment.

  ### Recommended experts
  - 👤 Alice (ERP)
  - 👤 Bob (Booking API)

  ### Confidence
  🟢 92%

  ### Suggested actions
  • View Knowledge Article
  • Start Expert Discussion
  • Search Similar Issues
  `);
    return;
  }

  // ERP
  if (message.includes("erp")) {
    await context.send(`
  # 🏢 ERP Issue

  I found **2 previous ERP incidents**.

  ### Possible causes
  - Service unavailable
  - Configuration mismatch
  - Failed deployment

  ### Recommended experts
  - 👤 Alice
  - 👤 Charlie

  ### Confidence
  🟢 88%
  `);
    return;
  }

  // Login
  if (message.includes("login") || message.includes("auth")) {
    await context.send(`
  # 🔐 Authentication Issue

  Possible causes:

  - Expired token
  - Azure AD configuration
  - Incorrect application registration

  ### Recommended experts

  - 👤 David
  - 👤 Emma

  ### Confidence

  🟢 95%
  `);
    return;
  }

  // Raise Incident
  if (
    message === "raise incident" ||
    message.includes("create incident") ||
    message.includes("report issue")
  ) {
    await context.send(`
🚨 **Incident Created**

**Incident ID**
INC-2026-0147

**Title**
Booking validation failure

**Priority**
🟠 High

**Assigned Team**
ERP Support

**Suggested Experts**
• Alice Johnson
• Bob Smith

**Status**
🟡 Awaiting engineer acknowledgement

You'll receive updates here in Teams.
`);
    return;
  }

  // Default response
  await context.send(`
  👋 Welcome to **Engineering Operations Copilot**

I'm here to help you resolve engineering issues faster by connecting people, knowledge, and operations.
 
Here's what I can help with:

👤 **Find an Expert**
> who knows erp
 
> who knows spektrum

📚 **Search Previous Issues**
> booking validation failed

🚨 **Raise an Incident**
> raise incident

💡 *Hackathon MVP – Responses currently use demo data.*
  `);
});

export default app;
