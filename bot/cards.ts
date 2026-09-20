import type { IAdaptiveCard } from "@microsoft/teams.cards";

/**
 * Where the "Open Dashboard" button points.
 *
 * Set DASHBOARD_URL in .localConfigs to override. Once the Teams tab in tab/
 * is wired up (workstream 3) this becomes the tab's deep link and the button
 * can be swapped for a real staticTab entry in appPackage/manifest.json.
 */
export const DASHBOARD_URL =
  process.env.DASHBOARD_URL ||
  "https://claude.ai/code/artifact/19a0b02d-e2fc-45b6-9f36-992517e0a9c4";

/** The skills the bot advertises, shown on the welcome and /help cards. */
const SKILLS = [
  { icon: "\u{1F464}", name: "Find experts", example: "who knows erp" },
  { icon: "\u{1F4DA}", name: "Search past issues", example: "booking validation failed" },
  { icon: "\u{1F6A8}", name: "Raise an incident", example: "raise incident" },
];

/**
 * A card that introduces the Copilot and links out to the operations dashboard.
 *
 * @param heading - Title line, e.g. a greeting or "Available skills".
 * @param intro - One sentence under the heading.
 */
export function dashboardCard(heading: string, intro: string): IAdaptiveCard {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5",
    body: [
      {
        type: "TextBlock",
        text: heading,
        weight: "Bolder",
        size: "Medium",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: intro,
        wrap: true,
        spacing: "Small",
        isSubtle: true,
      },
      {
        type: "FactSet",
        spacing: "Medium",
        facts: SKILLS.map((s) => ({
          title: `${s.icon} ${s.name}`,
          value: `"${s.example}"`,
        })),
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "\u{1F4CA} Open dashboard",
        url: DASHBOARD_URL,
      },
    ],
  };
}
