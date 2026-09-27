# Q&A — Anticipated Questions from Leadership & Stakeholders

*Prep sheet for presenting the Engineering Operations Copilot. Answers reflect the current POC state — see `Project_Info.md` for full detail and `OVERVIEW.md` for a one-page summary.*

---

## Business case

**Q: What problem does this actually solve?**
Employees waste time finding the right expert or a past solution — usually by asking a manager, who points them to someone, who points them to someone else, with the answer left buried in a private chat afterward. This puts that whole process inside one Teams conversation and, over time, turns every resolved problem into searchable knowledge instead of a one-off private answer.

**Q: What's the ROI / business impact?**
Primary metrics we'd track: time-to-find-an-expert, time-to-resolution, number of repeated questions, and knowledge reuse (how often a past solution gets reused instead of re-solved). None of this is instrumented yet — it's a roadmap item, not a current claim.

**Q: How is this different from just using ChatGPT/Copilot generically?**
The point isn't a generic chatbot — it's grounded in our own data: our expert directory, our past incidents, and (new) our Jira history. A generic LLM would guess or hallucinate an answer; this one looks up who on our team actually solved something similar and tells you who to talk to.

**Q: Who is this for, and who's the sponsor?**
Internal engineering/operations staff, used inside Microsoft Teams where they already work. Sponsor approval was already obtained for the hackathon POC (see `Project_Info.md`, status: "Sponsor approved / POC complete").

---

## Cost

**Q: What does this cost to run today?**
Effectively $0 — it runs on Google Gemini's **free tier** by deliberate design choice, specifically so the POC doesn't require spend approval. That free tier has real limits (as low as 20-1,000 requests/day depending on model), which we've already hit once during testing.

**Q: What would it cost in production?**
Unknown yet — depends on request volume and which AI provider/tier is chosen. The architecture is built with a swappable `AIService` layer specifically so we can move to an enterprise-licensed provider (e.g. company Claude access) without rearchitecting, once volume outgrows free-tier limits.

**Q: Are we paying for Jira, Azure, or anything else right now?**
Jira: using an existing demo/POC Atlassian site, no incremental cost. Azure: local development only right now: no cloud resources are provisioned for the AI/API layer. Teams app registration/hosting costs would apply once this moves beyond a local POC.

---

## Security & data privacy

**Q: Is this secure enough for real company data?**
Not yet — this is an honest gap, not a hidden one. There's currently no authentication/authorization layer (no Entra ID integration), no audit logging, and no access control on who can see which experts or incidents. "Security & Production Readiness" is an explicit, not-yet-started workstream in the roadmap.

**Q: Whose Jira/AI credentials is this using?**
Right now, a developer's personal Jira account and API token, and a personal Google account's Gemini API key. Both are flagged as POC-only — before any wider rollout, these need to become dedicated service accounts with scoped permissions, not tied to one person.

**Q: Could this leak information to the wrong people?**
With today's mock data, no real risk. Once real company data (SharePoint, real incidents, real people) is connected, this becomes the central open question: "users should only see information they are authorized to access" is written into the project's own guiding principles, and needs Entra-based auth before that's actually true.

**Q: Is any data leaving the company/going to a third party we haven't vetted?**
User messages and tool results currently go to Google's Gemini API (a third party) to generate replies. That's a real, existing data flow worth flagging explicitly to whoever owns data-handling policy, before this is used with real incident/expert data.

---

## Technical risk & maturity

**Q: How far along is this really?**
By the project's own estimate: the POC (bot works, demoable end-to-end) is roughly 70% done. The full product vision (real data, security, Microsoft 365 integration, admin tooling) is roughly 15-20% done. It's a working demo, not a production system.

**Q: What breaks this today if we're not careful?**
Two known fragile points: (1) the free-tier AI quota runs out fast under real usage (hit 20 requests/day limit already during testing), and (2) all data (experts, incidents) is currently mock/seeded, not real company data.

**Q: What's the single biggest technical gap before this is usable company-wide?**
Security and real data sourcing, tied together — moving off mock data means moving onto SharePoint/Graph/real incident systems, which immediately requires real authentication and access control to do safely.

**Q: Is this locked into one AI vendor?**
No — by design. The AI call is behind an abstraction (`AIService` → `GeminiProvider` now, `ClaudeProvider` later), specifically so the underlying model can be swapped without rewriting the bot.

---

## Adoption & rollout

**Q: How would employees actually start using this?**
It lives inside Microsoft Teams — no new app to install or learn, users just message the bot in a chat, group chat, or channel like they would a coworker.

**Q: What's the rollout plan?**
Not yet defined beyond the hackathon roadmap. The six-week plan in `Project_Info.md` covers foundation → knowledge → experts → AI → incidents/M365 → polish, ending in a presentation-ready demo, not a company-wide launch plan.

**Q: What happens if the bot gives a wrong or unhelpful answer?**
Today: it either says it found nothing and suggests raising an incident, or (if the AI service itself fails, e.g. hitting a rate limit) it falls back to a generic message listing what it can help with. There's no current mechanism for a human to correct/flag a bad answer, which would matter for trust at scale.

---

## Competitive / strategic framing

**Q: Isn't this just a support ticketing system with an AI wrapper?**
The differentiator is the **self-improving knowledge loop**: when someone asks about a topic with no internal history, the bot checks Jira for related work and surfaces who touched it — then saves that as a permanent local answer for the next person, closing the gap that experience normally lives only in one person's head.

**Q: What if the sponsor/leadership wants this to integrate with [some other tool]?**
The architecture treats the AI, knowledge search, expert lookup, and incident tracking as separate services behind a shared API layer — adding another data source (e.g. a different ticketing system, another wiki) is meant to be additive, not a rewrite. Not yet proven at scale, but that's the intent behind the current structure.
