import { GoogleGenAI, Content, Part } from "@google/genai";
import { toolDeclarations, toolHandlers } from "./tools";

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
- When you raise an incident, always report back the returned incident code, priority, assigned team, and suggested experts.
- For plain greetings or small talk, just reply naturally and briefly (1-3 sentences) - don't force tool use.`;

export async function getAIReply(userMessage: string): Promise<string> {
  const contents: Content[] = [{ role: "user", parts: [{ text: userMessage }] }];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return response.text ?? "Sorry, I couldn't come up with a reply.";
    }

    const modelParts = response.candidates?.[0]?.content?.parts;
    contents.push({ role: "model", parts: modelParts ?? [] });

    const responseParts: Part[] = [];
    for (const call of functionCalls) {
      const handler = call.name ? toolHandlers[call.name] : undefined;
      const result = handler
        ? await handler(call.args ?? {})
        : JSON.stringify({ error: `Unknown tool ${call.name}` });

      responseParts.push({
        functionResponse: { name: call.name ?? "", response: { result } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return "Sorry, I couldn't come up with a reply.";
}
