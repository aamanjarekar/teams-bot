import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db";
import { findExpertsViaJira } from "./jira";

const app = express();
app.use(cors());
app.use(express.json());

interface ExpertRow {
  name: string;
  role: string;
  email?: string;
  resolved_count: number;
  last_active: string;
  jiraUrl?: string;
}

function findExpertsByTopic(topic: string): ExpertRow[] {
  return db
    .prepare(
      `SELECT e.name as name, e.role as role, e.email as email, s.resolved_count as resolved_count, s.last_active as last_active
       FROM expert_skills s
       JOIN experts e ON e.id = s.expert_id
       WHERE lower(s.topic) = ?
       ORDER BY s.resolved_count DESC`,
    )
    .all(topic) as unknown as ExpertRow[];
}

// Record Jira-sourced matches into the local knowledge base so future lookups
// for this topic are served locally instead of hitting Jira again.
function recordExpertsFromJira(
  matches: { assigneeName: string; issueUrl: string }[],
  topic: string,
): ExpertRow[] {
  const lastActive = new Date().toISOString().slice(0, 10);

  return matches.map(({ assigneeName, issueUrl }) => {
    const existing = db.prepare("SELECT id FROM experts WHERE name = ?").get(assigneeName) as
      | { id: number }
      | undefined;

    const expertId =
      existing?.id ??
      (db
        .prepare("INSERT INTO experts (name, role) VALUES (?, ?)")
        .run(assigneeName, "Jira Contributor").lastInsertRowid as number);

    db.prepare(
      `INSERT INTO expert_skills (expert_id, topic, resolved_count, last_active)
       VALUES (?, ?, 1, ?)`,
    ).run(expertId, topic, lastActive);

    return {
      name: assigneeName,
      role: "Jira Contributor",
      resolved_count: 1,
      last_active: lastActive,
      jiraUrl: issueUrl,
    };
  });
}

// GET /experts?topic=erp
app.get("/experts", async (req, res) => {
  const topic = String(req.query.topic ?? "").toLowerCase().trim();
  if (!topic) {
    return res.status(400).json({ error: "Query param 'topic' is required" });
  }

  let rows = findExpertsByTopic(topic);
  let source: "knowledge_base" | "jira" = "knowledge_base";

  if (rows.length === 0) {
    const jiraMatches = await findExpertsViaJira(topic, 3);
    if (jiraMatches.length > 0) {
      rows = recordExpertsFromJira(jiraMatches, topic);
      source = "jira";
    }
  }

  res.json({
    topic,
    source,
    experts: rows.map((r) => ({
      name: r.name,
      role: r.role,
      ...(r.email ? { email: r.email } : {}),
      resolvedCount: r.resolved_count,
      lastActive: r.last_active,
      ...(r.jiraUrl ? { jiraUrl: r.jiraUrl } : {}),
    })),
  });
});

interface IncidentRow {
  incident_code: string;
  title: string;
  category: string;
  priority: string;
  assigned_team: string;
  suggested_experts: string;
  status: string;
  created_at: string;
}

// GET /incidents?query=booking
app.get("/incidents", (req, res) => {
  const query = String(req.query.query ?? "").toLowerCase().trim();
  if (!query) {
    return res.status(400).json({ error: "Query param 'query' is required" });
  }

  const like = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT incident_code, title, category, priority, assigned_team, suggested_experts, status, created_at
       FROM incidents
       WHERE lower(category) LIKE ? OR lower(title) LIKE ?
       ORDER BY created_at DESC
       LIMIT 10`,
    )
    .all(like, like) as unknown as IncidentRow[];

  res.json({
    query,
    count: rows.length,
    incidents: rows.map((r) => ({
      incidentCode: r.incident_code,
      title: r.title,
      category: r.category,
      priority: r.priority,
      assignedTeam: r.assigned_team,
      suggestedExperts: r.suggested_experts.split(", "),
      status: r.status,
      createdAt: r.created_at,
    })),
  });
});

// POST /incidents  { title, category, priority, description? }
app.post("/incidents", (req, res) => {
  const { title, category, priority } = req.body ?? {};
  if (!title || !category || !priority) {
    return res.status(400).json({ error: "Fields 'title', 'category', and 'priority' are required" });
  }

  const skillRows = db
    .prepare(
      `SELECT e.name as name, e.email as email
       FROM expert_skills s
       JOIN experts e ON e.id = s.expert_id
       WHERE lower(s.topic) = ?
       ORDER BY s.resolved_count DESC
       LIMIT 2`,
    )
    .all(String(category).toLowerCase()) as unknown as { name: string; email?: string }[];

  const suggestedExperts = skillRows.map((r) => r.name).join(", ") || "Unassigned";
  const assignedTeam = `${String(category).toUpperCase()} Support`;

  const year = new Date().getFullYear();
  const seq = (db.prepare("SELECT COUNT(*) as c FROM incidents").get() as { c: number }).c + 1;
  const incidentCode = `INC-${year}-${String(seq).padStart(4, "0")}`;

  db.prepare(
    `INSERT INTO incidents (incident_code, title, category, priority, assigned_team, suggested_experts, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(incidentCode, title, category, priority, assignedTeam, suggestedExperts, "Open");

  res.status(201).json({
    // Structured alongside the `suggestedExperts` string so the bot can
    // @mention these people instead of only naming them.
    experts: skillRows.map((r) => ({
      name: r.name,
      ...(r.email ? { email: r.email } : {}),
    })),
    incidentCode,
    title,
    category,
    priority,
    assignedTeam,
    suggestedExperts: suggestedExperts.split(", "),
    status: "Open",
  });
});

const PORT = Number(process.env.API_PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`Teams bot API listening on port ${PORT}`);
});
