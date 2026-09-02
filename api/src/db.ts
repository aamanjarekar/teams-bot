import path from "path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.join(__dirname, "..", "data", "app.db");
export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS experts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expert_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expert_id INTEGER NOT NULL REFERENCES experts(id),
    topic TEXT NOT NULL,
    resolved_count INTEGER NOT NULL DEFAULT 0,
    last_active TEXT NOT NULL DEFAULT 'Unknown'
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    assigned_team TEXT NOT NULL,
    suggested_experts TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seedIfEmpty() {
  const expertCount = db.prepare("SELECT COUNT(*) as c FROM experts").get() as { c: number };
  if (expertCount.c > 0) return;

  const insertExpert = db.prepare("INSERT INTO experts (name, role) VALUES (?, ?)");
  const insertSkill = db.prepare(
    "INSERT INTO expert_skills (expert_id, topic, resolved_count, last_active) VALUES (?, ?, ?, ?)",
  );

  db.exec("BEGIN");
  try {
    const alice = insertExpert.run("Alice Johnson", "ERP Lead").lastInsertRowid as number;
    insertSkill.run(alice, "erp", 18, "Today");
    insertSkill.run(alice, "booking", 18, "Today");

    const bob = insertExpert.run("Bob Smith", "Booking API").lastInsertRowid as number;
    insertSkill.run(bob, "erp", 12, "Yesterday");
    insertSkill.run(bob, "booking", 12, "Yesterday");

    const charlie = insertExpert.run("Charlie Brown", "Integration Specialist").lastInsertRowid as number;
    insertSkill.run(charlie, "erp", 9, "Unknown");

    const sarah = insertExpert.run("Sarah Chen", "Product Owner").lastInsertRowid as number;
    insertSkill.run(sarah, "spektrum", 24, "Unknown");

    const john = insertExpert.run("John Smith", "Senior Developer").lastInsertRowid as number;
    insertSkill.run(john, "spektrum", 17, "Unknown");

    const mike = insertExpert.run("Mike Wilson", "Support Engineer").lastInsertRowid as number;
    insertSkill.run(mike, "spektrum", 9, "Unknown");

    const david = insertExpert.run("David Wilson", "Cloud Architect").lastInsertRowid as number;
    insertSkill.run(david, "azure", 0, "Unknown");
    insertSkill.run(david, "login", 0, "Unknown");

    const emma = insertExpert.run("Emma Johnson", "Platform Engineer").lastInsertRowid as number;
    insertSkill.run(emma, "azure", 0, "Unknown");
    insertSkill.run(emma, "login", 0, "Unknown");

    const chris = insertExpert.run("Chris Brown", "DevOps Engineer").lastInsertRowid as number;
    insertSkill.run(chris, "azure", 0, "Unknown");

    const insertIncident = db.prepare(`
      INSERT INTO incidents (incident_code, title, category, priority, assigned_team, suggested_experts, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertIncident.run(
      "INC-2026-0101",
      "Booking validation failure after deployment",
      "booking",
      "High",
      "ERP Support",
      "Alice Johnson, Bob Smith",
      "Resolved",
    );
    insertIncident.run(
      "INC-2026-0087",
      "ERP service unavailable - configuration mismatch",
      "erp",
      "High",
      "ERP Support",
      "Alice Johnson, Charlie Brown",
      "Resolved",
    );
    insertIncident.run(
      "INC-2026-0132",
      "Login failures - expired Azure AD tokens",
      "login",
      "Medium",
      "Platform Support",
      "David Wilson, Emma Johnson",
      "Resolved",
    );

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

seedIfEmpty();
