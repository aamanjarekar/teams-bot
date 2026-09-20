import { GoogleGenAI, Content, Part } from "@google/genai";
import { toolDeclarations, toolHandlers } from "./tools";
import type { ExpertIdentity } from "./tools";

const ai = new GoogleGenAI({});
const MODEL = "gemini-3.6-flash";
const MAX_TOOL_TURNS = 5;

const SYSTEM_INSTRUCTION = `You are "Engineering Operations Copilot", a Microsoft Teams bot that helps engineers find experts, search past incidents, and raise new incidents.

You have tools backed by real internal APIs - use them instead of guessing:
- find_expert: look up who knows a topic
- search_incidents: search past incidents by keyword or category
- raise_incident: file a new incident and get back its incident code

Formatting rules for your replies (Teams renders Markdown):
- Keep responses concise, using headings/bullets/emoji sparingly, similar in style to: "🔍 **Expert Finder**", "🚨 **Incident Created**".
- If a tool returns no results, say so plainly and suggest raising an incident or rephrasing the topic.
- find_expert results include a "source" field ("knowledge_base" or "jira"). When source is "jira", each expert also has a "jiraUrl" - mention that this person was found via a related Jira issue and link it, e.g. "Amod M — worked on [CPG-5](url)". When source is "knowledge_base", just list the experts normally without mentioning Jira.
- When you raise an incident, always report back the returned incident code, priority, assigned team, and suggested experts.
- For plain greetings or small talk, just reply naturally and briefly (1-3 sentences) - don't force tool use.

Tagging people:
- To @mention someone, wrap their name in <at> tags exactly like <at>Alice Johnson</at>. Write the name inside the tags exactly as it appears in the tag list below.
- Only tag people who appear in the "People you can tag" list. Everyone else - experts from tools who aren't in that list, names in incident records - must be written as plain text with no <at> tags.
- Tag a person the first time you name them in a reply; after that use their plain name. Don't tag the same person twice in one reply, and don't tag anyone in a greeting or small talk.`;

/**
 * Names the model is allowed to wrap in `<at>` tags, appended to the system
 * instruction. Anything it tags outside this list is rendered as plain text by
 * the mention resolver, so this only improves the odds of a real ping.
 */
function taggingContext(names: string[]): string {
  if (names.length === 0) {
    return "\n\nPeople you can tag: nobody - do not use <at> tags in this conversation.";
  }
  return `\n\nPeople you can tag (use these names verbatim inside <at> tags):\n${names
    .map((name) => `- ${name}`)
    .join("\n")}`;
}

/**
 * Ask Gemini for a reply, running any tool calls it requests.
 *
 * @param userMessage - The user's message, mentions already stripped.
 * @param mentionable - Display names of conversation members the model may tag.
 */
export interface AIReply {
  text: string;
  /** People the tools named this turn, used to resolve @mentions. */
  directory: ExpertIdentity[];
}

export async function getAIReply(
  userMessage: string,
  mentionable: string[] = [],
): Promise<AIReply> {
  const contents: Content[] = [{ role: "user", parts: [{ text: userMessage }] }];
  const directory: ExpertIdentity[] = [];
  const collect = (identities: ExpertIdentity[]) => {
    for (const identity of identities) {
      if (!directory.some((d) => d.name === identity.name)) directory.push(identity);
    }
  };

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + taggingContext(mentionable),
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return { text: response.text ?? "Sorry, I couldn't come up with a reply.", directory };
    }

    const modelParts = response.candidates?.[0]?.content?.parts;
    contents.push({ role: "model", parts: modelParts ?? [] });

    const responseParts: Part[] = [];
    for (const call of functionCalls) {
      const handler = call.name ? toolHandlers[call.name] : undefined;
      const result = handler
        ? await handler(call.args ?? {}, collect)
        : JSON.stringify({ error: `Unknown tool ${call.name}` });

      responseParts.push({
        functionResponse: { name: call.name ?? "", response: { result } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { text: "Sorry, I couldn't come up with a reply.", directory };
}
