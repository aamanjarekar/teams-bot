const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

export interface JiraExpertMatch {
  issueKey: string;
  issueSummary: string;
  issueUrl: string;
  projectKey: string;
  assigneeName: string;
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
}

// Returns up to `limit` matches, one per distinct assignee, ranked by Jira's
// text-relevance order (not recency - relevance matters more once the site
// has a large issue history).
export async function findExpertsViaJira(topic: string, limit = 3): Promise<JiraExpertMatch[]> {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) return [];

  const jql = `text ~ "${topic.replace(/"/g, "")}" AND assignee is not EMPTY`;
  // Over-fetch since multiple issues can share the same assignee and we dedupe below.
  const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${
    limit * 5
  }&fields=summary,assignee,project`;

  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    issues?: {
      key: string;
      fields: {
        summary: string;
        project: { key: string };
        assignee: { displayName: string } | null;
      };
    }[];
  };

  const seenAssignees = new Set<string>();
  const matches: JiraExpertMatch[] = [];

  for (const issue of data.issues ?? []) {
    const assignee = issue.fields.assignee;
    if (!assignee || seenAssignees.has(assignee.displayName)) continue;
    seenAssignees.add(assignee.displayName);

    matches.push({
      issueKey: issue.key,
      issueSummary: issue.fields.summary,
      issueUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
      projectKey: issue.fields.project.key,
      assigneeName: assignee.displayName,
    });

    if (matches.length >= limit) break;
  }

  return matches;
}
