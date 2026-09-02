# AI Operations / Engineering Operations Copilot
## Hackathon Project Plan & Product Vision

> **Status:** Sponsor approved / POC complete  
> **Hackathon timeline:** ~6 weeks remaining  
> **Primary platform:** Microsoft Teams  
> **POC AI provider:** Gemini free tier  
> **Target production AI provider:** Company Claude Enterprise / approved company Claude access

---

## 1. Executive Summary

The project is an **AI-powered Operations / Engineering Operations Copilot integrated into Microsoft Teams**.

The goal is to give employees a single place to:

- Find the right expert for a problem
- Search previous issues and their resolutions
- Discover reusable organizational knowledge
- Raise and track incidents
- Eventually interact with company knowledge using natural-language AI
- Reduce repeated questions and dependence on manually finding the right person

The solution is designed to work with the tools the company already uses, especially **Microsoft Teams, SharePoint, Microsoft Entra ID, and Microsoft Graph**, rather than forcing users into a completely new workflow.

---

## 2. Problem Statement

Employees spend valuable time searching for the right information, the right expert, or previous solutions.

Knowledge is scattered across Teams, SharePoint, emails, and individual experience, leading to:

- Repeated questions
- Delayed issue resolution
- Difficulty finding subject matter experts
- Knowledge being lost when people are unavailable or leave
- Different employees solving the same problem repeatedly
- Excessive dependency on managers to identify the correct person

### Current support workflow

A typical problem may look like:

1. Employee encounters an issue.
2. Employee asks their manager.
3. Manager identifies someone who might know the answer.
4. Employee contacts that person.
5. If that person is unavailable or does not know the answer, another person is recommended.
6. The solution may remain in a private chat and become difficult for others to find later.

The Copilot aims to turn this into a reusable organizational knowledge workflow.

---

## 3. Impact

By enabling employees to quickly find the right knowledge, experts, and previous solutions within Microsoft Teams, the solution aims to:

- Reduce time spent searching for information
- Improve collaboration across teams
- Accelerate issue resolution
- Reduce repeated questions
- Preserve organizational knowledge
- Make existing company information easier to discover and reuse
- Reduce dependency on individual people for institutional knowledge

---

## 4. Proposed Solution

Develop an **AI-powered Engineering Operations Copilot integrated into Microsoft Teams**.

The Copilot will provide a single interface where employees can:

### 🔍 Find Experts

Ask questions such as:

```text
who knows ERP?
who knows Spektrum?
who can help with booking?
```

The system should return relevant subject matter experts based on skills, systems, teams, experience, or previous involvement.

### 📚 Search Knowledge

Ask questions such as:

```text
booking validation failed
how do I fix shipment allocation?
why is the AWB creation failing?
```

The system should find relevant previous issues, documentation, and resolutions.

### 🚨 Raise Incidents

Employees should be able to create an incident directly from Teams.

The Copilot can eventually:

- Understand the problem
- Suggest priority
- Suggest the responsible team
- Recommend experts
- Link similar historical incidents
- Track the incident status
- Notify the user of updates

---

# 5. Product Experience

## Teams Bot

The bot is the primary conversational interface.

Example welcome message:

```text
🤖 Hello! I'm your Engineering Operations Copilot.

I can help you:

🔍 Find the right expert
📚 Search similar issues and resolutions
🚨 Create and track incidents

Try asking:

• who knows erp
• who knows spektrum
• booking validation failed
• raise incident
```

The bot should eventually support natural-language questions rather than requiring exact commands.

---

## Teams Tab / Dashboard

The Teams tab provides a visual interface alongside the conversational bot.

Potential dashboard sections:

### Search

Search across organizational knowledge.

### Recent Activity

Show the user's recent searches, incidents, or viewed solutions.

### Popular / Trending Issues

Show frequently searched or recently reported issues.

### Expert Directory

Allow users to browse or search for subject matter experts.

### Incidents

Show active and recently created incidents.

### Knowledge

Show reusable solutions, documentation, and previous issues.

The dashboard should complement the bot rather than duplicate it.

---

# 6. Current POC

The initial POC has already been demonstrated and received sponsor approval.

## Completed

- Hackathon idea defined
- Problem statement defined
- Sponsor obtained
- Microsoft Teams app created
- Microsoft 365 Agents Toolkit project created
- Echo Bot template created
- Bot running locally
- Teams integration working
- Basic bot interaction working
- Expert Finder demo implemented
- Knowledge Search demo implemented
- Incident creation demo implemented
- Basic welcome/help experience implemented
- Teams Tab capability added to the project structure

### Current demo commands / concepts

```text
who knows erp
who knows spektrum
booking validation failed
raise incident
```

The current data is demo/mock data.

---

# 7. AI Strategy

## POC

The POC should use an AI provider that does not require personal spending.

Current preferred provider:

**Google Gemini API using its available free tier.**

The application should not become dependent on Gemini.

## Provider abstraction

The application should use an abstraction layer:

```text
Teams Bot
    ↓
AIService
    ↓
GeminiProvider
```

Later:

```text
Teams Bot
    ↓
AIService
    ↓
ClaudeProvider
    ↓
Company Claude
```

This allows the AI provider to be changed without rewriting the rest of the application.

## Important design principle

The bot should never directly call Gemini or Claude from individual command handlers.

Instead:

```ts
const response = await aiService.ask({
    message,
    context
});
```

The provider-specific implementation stays behind `AIService`.

---

# 8. Proposed Architecture

```text
                         Microsoft Teams
                    ┌──────────┬───────────┐
                    │          │           │
                  Bot        Tab       Future Extension
                    │          │           │
                    └──────────┴───────────┘
                               │
                               ▼
                         Node / TypeScript
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
          AI Service     Knowledge Service   Expert Service
             │                 │                 │
             ▼                 ▼                 ▼
       Gemini / Claude      SharePoint        Graph / Data
                               │
                               ▼
                       Incident Service
                               │
                               ▼
                     Incident Management System
```

Potential future integrations:

```text
Microsoft Teams
      │
      ├── Bot
      ├── Personal Tab
      └── Message Extension
              │
              ▼
          Node API
              │
      ┌───────┼────────┬──────────┐
      ▼       ▼        ▼          ▼
     AI    Search    Experts   Incidents
      │       │        │          │
      └───────┴────────┴──────────┘
              │
      ┌───────┼───────────────┐
      ▼       ▼               ▼
 SharePoint  Graph       Company systems
```

---

# 9. Suggested Code Structure

```text
src/
├── bot/
│   ├── handlers/
│   └── ...
│
├── routes/
│
├── services/
│   ├── ai/
│   │   ├── AIService.ts
│   │   ├── GeminiProvider.ts
│   │   └── ClaudeProvider.ts
│   │
│   ├── knowledge/
│   ├── experts/
│   ├── graph/
│   └── incidents/
│
├── models/
│
├── adapters/
│
└── utils/
```

Current Teams project organization also includes the Teams bot and tab components.

---

# 10. Six-Week Roadmap

## Workstream 1 — Foundation & Project Setup

### Tasks

- Finalize product scope
- Finalize architecture
- Clean up Teams app project
- Organize bot and tab code
- Establish Node/TypeScript project structure
- Establish configuration/environment handling
- Define service interfaces
- Introduce AI provider abstraction
- Define mock/demo data models
- Define API boundaries
- Define basic security approach

### Deliverable

A clean foundation that can evolve from POC into a real application.

---

# Workstream 2 — Bot Experience

### Tasks

- Replace hardcoded command-only behavior with a flexible command/router structure
- Improve welcome message
- Add natural-language intent detection
- Support expert discovery
- Support knowledge search
- Support incident creation
- Add conversation context
- Improve error handling
- Add useful response formatting
- Add citations/references to knowledge responses where possible

### Deliverable

A useful conversational Copilot rather than a simple demo bot.

---

# Workstream 3 — Teams Dashboard / Tab

### Tasks

- Build dashboard UI
- Add global knowledge search
- Add expert search
- Add recent activity
- Add incident list
- Add popular/trending issues
- Add knowledge/solution cards
- Connect dashboard to backend services
- Ensure dashboard and bot provide complementary experiences

### Deliverable

A visual Teams experience that demonstrates the broader product beyond the chatbot.

---

# Workstream 4 — Knowledge Management

### Tasks

- Define knowledge model
- Create initial knowledge repository
- Store previous issues and resolutions
- Store documentation references
- Store system/application information
- Store tags/categories
- Support knowledge search
- Support similar-issue discovery
- Track source/reference information
- Design reusable resolution format

### Example knowledge record

```text
Issue:
Booking validation failed

System:
Booking

Symptoms:
Validation fails when ...

Resolution:
...

Resolved by:
...

Team:
...

Tags:
booking, validation, ERP

Source:
...
```

### Deliverable

A searchable repository of reusable organizational knowledge.

---

# Workstream 5 — Expert Discovery

### Tasks

- Define expert profile model
- Define skills
- Define systems/applications
- Define teams
- Connect experts to skills
- Connect experts to systems
- Connect experts to historical incidents/issues
- Build expert search
- Rank recommended experts
- Display reasons for recommendation

### Future knowledge graph concept

```text
Expert
  │
  ├── Skill
  ├── System
  ├── Team
  └── Incident

System
  │
  ├── Team
  ├── Expert
  └── Knowledge Article

Incident
  │
  ├── System
  ├── Expert
  ├── Team
  └── Resolution
```

### Deliverable

A system that can answer:

> "Who is most likely to help me with this?"

---

# Workstream 6 — AI Integration

### Tasks

- Integrate Gemini for POC
- Create AIService abstraction
- Define prompts
- Define context format
- Add knowledge context to prompts
- Add expert context to prompts
- Add incident context to prompts
- Implement response generation
- Add grounding/source references
- Handle unknown information safely
- Add provider configuration
- Prepare Claude provider interface

### Important goal

The AI should not simply generate answers.

It should use organizational data:

```text
User question
      ↓
Understand intent
      ↓
Search relevant knowledge
      ↓
Find relevant experts
      ↓
Retrieve incident context
      ↓
Give grounded answer
      ↓
Show sources / recommended actions
```

---

# Workstream 7 — Incident Management

### Tasks

- Define incident model
- Create incident
- Assign team
- Recommend experts
- Set priority
- Track status
- Show incident history
- Link incidents to knowledge
- Link incidents to previous similar incidents
- Notify users about updates
- Add incident dashboard

### Example

```text
User:
"Booking validation is failing for customer ABC."

Copilot:

I found 3 similar incidents.

Most likely team:
ERP Support

Recommended experts:
Alice Johnson
Bob Smith

Suggested priority:
High

Create incident?
```

### Deliverable

An end-to-end support workflow from problem → expert/knowledge → incident → resolution → reusable knowledge.

---

# Workstream 8 — Microsoft 365 Integration

## Microsoft Graph

Potential uses:

- User profiles
- Department/team information
- Organization directory
- Presence/availability where permitted
- Relevant Teams information
- Other Microsoft 365 data

## SharePoint

Potential uses:

- Documentation
- Existing knowledge articles
- Project documents
- Process documents
- Support documentation

### Tasks

- Identify available company data sources
- Identify required permissions
- Define Graph integration
- Define SharePoint integration
- Retrieve documents/metadata
- Normalize retrieved information
- Connect retrieved information to search/AI
- Implement appropriate access control

### Important principle

Users should only receive information they are authorized to access.

---

# Workstream 9 — Admin / Management

Potential future admin experience:

- Manage experts
- Manage skills
- Manage teams
- Manage systems
- Review incidents
- Manage knowledge
- Correct inaccurate expert mappings
- View usage/search statistics
- Identify knowledge gaps
- Identify frequently repeated problems

### Example insight

```text
Most searched issue:
Booking validation failed

Searches this month:
47

Existing documentation:
None

Recommended action:
Create knowledge article
```

---

# Workstream 10 — Security & Production Readiness

### Tasks

- Microsoft Entra authentication
- Authorization
- Microsoft Graph permission review
- SharePoint permission handling
- Secrets management
- Environment configuration
- API security
- Input validation
- Logging
- Error handling
- Audit logging
- Rate limiting where appropriate
- Data privacy review
- Access control
- AI prompt/data security

---

# Workstream 11 — Testing

### Tasks

- Bot tests
- Service tests
- API tests
- Knowledge search tests
- Expert ranking tests
- Incident workflow tests
- AI response tests
- Permission tests
- Error scenarios
- Teams integration testing
- End-to-end testing

---

# Workstream 12 — Polish & Hackathon Presentation

### Tasks

- Improve Teams UI
- Improve bot responses
- Add loading/error states
- Improve dashboard UX
- Clean demo data
- Prepare realistic scenarios
- Prepare end-to-end demo
- Measure productivity improvements
- Prepare architecture diagram
- Prepare problem/solution slides
- Prepare before/after workflow
- Prepare future roadmap
- Prepare presentation script
- Practice live demo
- Prepare backup demo/screenshots/video

### Presentation principle

The final presentation should focus on:

```text
Problem
   ↓
Current painful workflow
   ↓
Copilot
   ↓
Faster resolution
   ↓
Reusable organizational knowledge
   ↓
Business impact
```

---

# 11. Priority Order

For the limited hackathon timeline, prioritize features in this order:

## P0 — Must Have

- Teams Bot
- Teams Tab
- Expert Finder
- Knowledge Search
- AI integration
- Incident creation
- Reusable knowledge model
- Basic Microsoft 365 integration
- Strong end-to-end demo

## P1 — Should Have

- SharePoint integration
- Microsoft Graph integration
- Similar issue detection
- Expert ranking
- Incident tracking
- Knowledge citations
- Dashboard analytics
- Better AI context handling

## P2 — Nice to Have

- Message extension
- Admin portal
- Knowledge graph
- Advanced analytics
- Automatic knowledge extraction
- Automated incident classification
- Advanced notifications
- More enterprise integrations

---

# 12. Six-Week Target

## Week 1 — Foundation

**Goal:** Clean architecture and project foundation.

Focus:

- Project structure
- Bot cleanup
- Tab foundation
- AI abstraction
- Data models
- Mock data

---

## Week 2 — Knowledge

**Goal:** Make organizational knowledge searchable.

Focus:

- Knowledge repository
- Search
- Previous solutions
- Knowledge UI
- Bot knowledge queries

---

## Week 3 — Experts

**Goal:** Make expert discovery useful.

Focus:

- Expert data
- Skills
- Systems
- Teams
- Expert ranking
- Graph/user integration where possible

---

## Week 4 — AI

**Goal:** Turn the system into a genuine Copilot.

Focus:

- Gemini
- Intent detection
- Retrieval + AI
- Grounded answers
- Context
- AIService abstraction
- Claude provider preparation

---

## Week 5 — Incidents & Microsoft 365

**Goal:** Complete the support workflow.

Focus:

- Incident creation
- Incident tracking
- SharePoint
- Microsoft Graph
- Similar incidents
- End-to-end workflows

---

## Week 6 — Polish & Presentation

**Goal:** Make the product presentation-ready.

Focus:

- UX polish
- Testing
- Security review
- Performance
- Demo scenarios
- Metrics
- Presentation
- Backup demo

---

# 13. Example End-to-End User Journey

### Scenario

An employee encounters a booking validation error.

### Step 1 — Ask the Copilot

```text
Booking validation is failing.
```

### Step 2 — Copilot searches knowledge

```text
I found 3 similar issues.

The most relevant resolution was:
...

Source:
...
```

### Step 3 — Find experts

```text
People who have previously worked on this:

1. Alice Johnson
   ERP + Booking
   Resolved 8 similar incidents

2. Bob Smith
   Booking Platform
   Resolved 4 similar incidents
```

### Step 4 — Create incident

```text
I can create an incident with:

Priority: High
Team: ERP Support
Suggested expert: Alice Johnson

Create it?
```

### Step 5 — Track

```text
INC-2026-0147

Status:
Awaiting engineer acknowledgement
```

### Step 6 — Preserve knowledge

After resolution:

```text
Resolution detected.

Save this as reusable knowledge?
```

This closes the loop:

```text
Problem
 ↓
Search
 ↓
Expert
 ↓
Incident
 ↓
Resolution
 ↓
Knowledge
 ↓
Future employee gets faster answer
```

---

# 14. What Makes This More Than a Chatbot

The key differentiator should be that the Copilot is connected to organizational knowledge and workflows.

It is not:

```text
User → LLM → generic answer
```

It should become:

```text
User
 ↓
Copilot
 ↓
Understand request
 ↓
Search company knowledge
 ↓
Find relevant experts
 ↓
Check similar incidents
 ↓
Recommend action
 ↓
Create/track incident if required
 ↓
Preserve the eventual resolution
```

This creates a **knowledge loop** where every resolved problem can improve the organization's ability to solve the next one.

---

# 15. Long-Term Vision

The eventual product could become an **organizational operations knowledge layer inside Microsoft Teams**.

It could understand relationships between:

- People
- Skills
- Teams
- Applications
- Systems
- Documents
- Incidents
- Solutions
- Projects

Example:

```text
"Who can help me with this?"

        ↓

Copilot understands the issue

        ↓

Finds relevant systems

        ↓

Finds historical incidents

        ↓

Finds people who solved them

        ↓

Finds documentation

        ↓

Provides answer

        ↓

Creates incident if necessary

        ↓

Stores the resolution
```

---

# 16. Success Metrics

Potential metrics to demonstrate value:

### Time to Find Expert

Before:

```text
Manager → person → another person → expert
```

After:

```text
Copilot → recommended expert
```

### Time to Find Resolution

Measure:

- Search time
- Number of people contacted
- Number of repeated questions
- Time from issue creation to resolution

### Knowledge Reuse

Measure:

- Number of previous solutions reused
- Number of incidents linked to existing solutions
- Number of new knowledge articles created

### Adoption

Measure:

- Searches
- Expert lookups
- Incidents created
- Knowledge articles viewed
- Successful searches

---

# 17. Hackathon Demo Story

A strong final demo can follow one employee's complete journey.

### Scene 1 — The problem

Employee encounters a problem.

> "Booking validation is failing."

### Scene 2 — Search

Copilot finds similar historical problems.

### Scene 3 — Expert

Copilot identifies people who have solved similar issues.

### Scene 4 — Incident

Employee creates an incident without leaving Teams.

### Scene 5 — Resolution

Incident gets resolved.

### Scene 6 — Knowledge reuse

The resolution becomes reusable knowledge.

### Scene 7 — Future employee

Another employee encounters the same problem.

Instead of asking their manager:

```text
Copilot → previous solution → resolution
```

This demonstrates the core business value.

---

# 18. Current Status

Approximate status based on the original hackathon vision:

### POC

**~70% complete**

The initial concept, Teams app, working bot, expert finder, knowledge demo, incident demo, and sponsor approval are already in place.

### Full Product Vision

**~15–20% complete**

The major remaining work is real data, AI integration, Teams dashboard, Microsoft 365 integration, real incident workflows, security, testing, production architecture, and presentation.

These percentages are directional rather than formal project-management measurements.

---

# 19. Key Technical Decisions

| Area | POC | Target |
|---|---|---|
| Interface | Microsoft Teams | Microsoft Teams |
| Bot | Teams SDK / Agents Toolkit | Teams SDK / supported Microsoft 365 stack |
| Language | Node.js + TypeScript | Node.js + TypeScript |
| AI | Gemini free tier | Company Claude |
| Knowledge | Mock/local data initially | SharePoint + company sources |
| Users | Mock data initially | Microsoft Entra / Graph |
| Experts | Mock data initially | Graph + company data |
| Incidents | Demo workflow | Real company incident system |
| Search | Basic implementation | Retrieval/search over company knowledge |
| Hosting | Local / hackathon environment | Company-approved Azure/company infrastructure |
| Auth | Development configuration | Microsoft Entra |
| UI | Teams Tab | Teams Tab + Bot |

---

# 20. Guiding Principles

1. **Minimal interference with users**  
   The Copilot should work inside Teams, where employees already communicate.

2. **Reuse existing company systems**  
   Avoid creating duplicate repositories when useful information already exists in SharePoint, Teams, Graph, or existing business systems.

3. **Knowledge should be reusable**  
   A solution given to one employee should become discoverable by others when appropriate.

4. **AI should be grounded**  
   Prefer company information and sources over generic model knowledge.

5. **Keep the AI provider replaceable**  
   The application should not be tightly coupled to Gemini or Claude.

6. **Security by design**  
   Users should only see information they are authorized to access.

7. **Build toward a real product**  
   The POC should establish architecture that can evolve into a production system.

8. **Demo the business outcome**  
   The presentation should focus on reduced search time, faster resolution, and knowledge reuse—not just the technology.

---

# 21. Immediate Development Direction

The next development phase should move the project from:

```text
Hardcoded POC
```

toward:

```text
Real data
    +
AI
    +
Search
    +
Expert discovery
    +
Incident workflow
    +
Teams dashboard
```

The first AI implementation should use a provider that can be used without personal spending, behind the `AIService` abstraction. Once the company provides approved access to Claude, the provider can be replaced without changing the overall product architecture.

---

## Final Product Vision

> **An AI-powered organizational operations copilot inside Microsoft Teams that helps employees find the right knowledge, the right expert, and the right action—while turning every resolved problem into reusable organizational knowledge.**
