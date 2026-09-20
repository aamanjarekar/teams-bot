# Operations API

Backs the Engineering Operations Copilot bot: expert lookup, incident search and
incident creation. SQLite, seeded on first run (`data/app.db`).

```bash
npm install
npm run dev      # http://localhost:4000
```

Secrets (Jira credentials) live in `api/.env`, which is gitignored.

## Expert identities and @mentions

The bot can @mention the experts it finds, but Teams only delivers a mention
when the person is **a member of the conversation**. Matching happens on
`experts.email`, not on display name — the knowledge base and Teams routinely
know the same person by different names.

`GET /experts` and `POST /incidents` both return `email` alongside `name`. The
bot carries that through and maps it onto the conversation roster; anyone it
can't match renders as bold text instead of a dead tag.

### The seeded emails are fake

`DEMO_EXPERT_EMAILS` in [src/db.ts](src/db.ts) maps the seeded experts onto the
Microsoft 365 Agents Playground's built-in users, so mentions resolve during
local testing:

| Knowledge base | Playground user | Email |
| --- | --- | --- |
| Alice Johnson, David Wilson | Megan Bowen | `meganb@example.com` |
| Bob Smith, Emma Johnson | Adele Vance | `adelev@example.com` |
| Charlie Brown, Chris Brown | Isaiah Langer | `isaiahl@example.com` |
| Sarah Chen | Patti Fernandez | `pattif@example.com` |
| John Smith | Lynne Robbins | `lynner@example.com` |
| Mike Wilson | Alex Wilber | `alexw@example.com` |

**`example.com` addresses will never notify a real person.** Replace them
before using this with an actual team.

### Swapping in real addresses

Update `DEMO_EXPERT_EMAILS` for fresh databases, then fix any existing one in
place — `backfillDemoEmails()` only fills `NULL` rows, so it won't overwrite
what you set:

```sql
UPDATE experts SET email = 'real.person@smartkargo.com' WHERE name = 'Alice Johnson';
```

```bash
sqlite3 data/app.db "UPDATE experts SET email = 'real.person@smartkargo.com' WHERE name = 'Alice Johnson';"
```

Experts auto-created from Jira (`recordExpertsFromJira`) have no email yet, so
they are named but not tagged. Give them one the same way to make them
mentionable.

### Checking it works

In the bot, `/tag` lists everyone the current conversation lets you mention.
A personal chat only ever contains you — use a group chat or channel.
