import { MessageActivityInput } from "@microsoft/teams.api";
import type { Account, TeamsChannelAccount } from "@microsoft/teams.api";
import type { ExpertIdentity } from "./tools";

/**
 * Turning names in an AI reply into real Teams @mentions.
 *
 * Teams only delivers a mention (highlight + activity-feed ping) when the
 * mentioned account is a member of the conversation, so everything here is
 * driven off the conversation roster. Names we can't resolve to a member fall
 * back to bold text rather than a dead `<at>` tag.
 */

/** How long a fetched roster stays usable before we ask Teams again. */
const ROSTER_TTL_MS = 5 * 60 * 1000;

/** Matches the `<at>Some Name</at>` markers the model is asked to emit. */
const MENTION_MARKER = /<at>([^<]+)<\/at>/g;

const rosterCache = new Map<
  string,
  { members: TeamsChannelAccount[]; expiresAt: number }
>();

/**
 * The slice of the activity context we need — declared structurally so this
 * module doesn't depend on the SDK's handler-context types.
 */
export interface RosterContext {
  api: {
    conversations: {
      getMembers(conversationId: string): Promise<TeamsChannelAccount[]>;
    };
  };
  activity: { conversation: { id: string } };
}

/** Lowercase, collapse whitespace and drop a leading `@` for comparison. */
function normalize(value: string | undefined): string {
  return (value ?? "").trim().replace(/^@/, "").replace(/\s+/g, " ").toLowerCase();
}

/**
 * Members of the current conversation, cached per conversation.
 *
 * Returns an empty roster if Teams refuses the call (unauthenticated local
 * runs, the playground) — callers then simply render names as plain text.
 */
export async function getRoster(
  context: RosterContext,
): Promise<TeamsChannelAccount[]> {
  const conversationId = context.activity.conversation.id;
  const cached = rosterCache.get(conversationId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.members;
  }

  try {
    const members = await context.api.conversations.getMembers(conversationId);
    rosterCache.set(conversationId, {
      members,
      expiresAt: Date.now() + ROSTER_TTL_MS,
    });
    return members;
  } catch (error) {
    console.error("Could not fetch conversation roster:", error);
    return [];
  }
}

/** Display names of everyone we could tag, for prompting the model. */
export function mentionableNames(roster: TeamsChannelAccount[]): string[] {
  return roster.map((member) => member.name).filter(Boolean);
}

/**
 * Find the roster member a label refers to.
 *
 * Tries email/UPN, then the full display name, then a unique given-name or
 * prefix match so "Alice" resolves to "Alice Johnson" — but only when exactly
 * one member matches, so we never tag the wrong person.
 */
export function resolveMember(
  roster: TeamsChannelAccount[],
  label: string,
  directory: ExpertIdentity[] = [],
): TeamsChannelAccount | undefined {
  const wanted = normalize(label);
  if (!wanted) return undefined;

  // The knowledge base may know someone under a different display name than
  // Teams does, so try their recorded email before falling back to names.
  const known = directory.find((d) => normalize(d.name) === wanted);
  if (known?.email) {
    const byKnownEmail = roster.find((m) => normalize(m.email) === normalize(known.email));
    if (byKnownEmail) return byKnownEmail;
  }

  const byAddress = roster.find(
    (m) =>
      normalize(m.email) === wanted || normalize(m.userPrincipalName) === wanted,
  );
  if (byAddress) return byAddress;

  const byName = roster.find((m) => normalize(m.name) === wanted);
  if (byName) return byName;

  const partial = roster.filter((m) => {
    const name = normalize(m.name);
    return (
      normalize(m.givenName) === wanted ||
      name.startsWith(`${wanted} `) ||
      name.endsWith(` ${wanted}`)
    );
  });
  return partial.length === 1 ? partial[0] : undefined;
}

/** The account shape Teams wants inside a mention entity. */
function toAccount(member: TeamsChannelAccount): Account {
  return {
    id: member.id,
    name: member.name,
    aadObjectId: member.aadObjectId,
    role: "user",
  };
}

/**
 * Build the outgoing message, swapping `<at>Name</at>` markers for real
 * mentions of conversation members.
 *
 * @param text - Reply text, possibly containing `<at>` markers.
 * @param roster - Members eligible to be mentioned.
 * @param directory - People the tools named, used to map a name to an email.
 */
export function toMentionMessage(
  text: string,
  roster: TeamsChannelAccount[],
  directory: ExpertIdentity[] = [],
): MessageActivityInput {
  const message = new MessageActivityInput();
  let cursor = 0;

  for (const match of text.matchAll(MENTION_MARKER)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      message.addText(text.slice(cursor, start));
    }

    const label = match[1].trim();
    const member = resolveMember(roster, label, directory);
    if (member) {
      message.addMention(toAccount(member), { text: member.name });
    } else {
      // Not in this conversation — Teams can't notify them, so keep it readable.
      message.addText(`**${label}**`);
    }

    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    message.addText(text.slice(cursor));
  }

  return message;
}
