# Engineering Operations Copilot — Project Overview

*A quick-read summary. For full detail, see `Project_Info.md` in the project source.*

## The problem

Employees waste time hunting for the right expert or a past solution — usually by asking their manager, who points them to someone, who points them to someone else. Answers end up buried in private chats instead of becoming reusable knowledge.

## The idea

An AI copilot inside Microsoft Teams that:
- Finds the right expert for a problem
- Searches past issues and resolutions
- Lets employees raise incidents without leaving Teams
- Turns every answer into knowledge the next person can find

## What's built so far

- **Conversational bot in Microsoft Teams**, powered by Google Gemini, with real tool-calling (not scripted replies) — the AI decides when to search for an expert, search past issues, or raise an incident.
- **A working internal API + database** backing all of that: expert directory, incident records, keyword search.
- **Jira fallback for expert discovery** — if no one in the internal knowledge base matches a topic, the bot searches Jira for related work, suggests whoever worked on it, and saves that result so the next lookup is answered instantly from local knowledge. This is the self-improving "knowledge loop" the product is built around.
- **Real @mentions** — when the bot recommends an expert who's in the current conversation, it tags them directly instead of just printing a name.
- **One-click "Start chat"** — a button next to a recommended expert that opens a group chat with the requester, the expert, and the bot, so the handoff happens without leaving Teams.
- **A Teams dashboard tab** alongside the conversational bot.

## Try it

Ask the bot things like:
- `who knows erp`
- `booking validation failed`
- `raise incident`

## Current state

Proof of concept, demoed and working end-to-end locally. Demo data (experts, incidents) is mock/seeded; the Jira integration is live against a real demo Jira site. AI provider is Gemini's free tier by design — the product is built so this can be swapped for an enterprise provider without rearchitecting.

## What's next

- Move off mock data onto real company sources (SharePoint, Microsoft Graph, Entra ID)
- Build out the Teams dashboard (search, expert directory, incident tracking)
- Replace personal Jira credentials with a proper service account
- Add authentication, permissions, and audit logging for production use
- Expand the AI provider layer to support an enterprise Claude deployment

