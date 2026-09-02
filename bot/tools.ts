import { FunctionDeclaration, Type } from "@google/genai";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function callApi(path: string, init?: RequestInit): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    return JSON.stringify({ error: `Request failed with status ${res.status}: ${res.statusText}` });
  }
  return JSON.stringify(await res.json());
}

export const findExpertDeclaration: FunctionDeclaration = {
  name: "find_expert",
  description:
    "Find engineers who know a given topic (e.g. erp, spektrum, azure, booking, login), ranked by resolved-issue count.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: "Topic to search for, e.g. 'erp', 'azure', 'booking'",
      },
    },
    required: ["topic"],
  },
};

async function findExpert(args: Record<string, unknown>): Promise<string> {
  return callApi(`/experts?topic=${encodeURIComponent(String(args.topic ?? ""))}`);
}

export const searchIncidentsDeclaration: FunctionDeclaration = {
  name: "search_incidents",
  description: "Search past incidents by keyword or category (e.g. booking, erp, login).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Keyword or category to search incidents for",
      },
    },
    required: ["query"],
  },
};

async function searchIncidents(args: Record<string, unknown>): Promise<string> {
  return callApi(`/incidents?query=${encodeURIComponent(String(args.query ?? ""))}`);
}

export const raiseIncidentDeclaration: FunctionDeclaration = {
  name: "raise_incident",
  description: "Create a new incident ticket and get back its incident code, assigned team, and suggested experts.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Short title describing the incident",
      },
      category: {
        type: Type.STRING,
        description: "Category, e.g. erp, booking, login, azure, spektrum",
      },
      priority: {
        type: Type.STRING,
        description: "Priority level",
        enum: ["Low", "Medium", "High"],
      },
    },
    required: ["title", "category", "priority"],
  },
};

async function raiseIncident(args: Record<string, unknown>): Promise<string> {
  return callApi("/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: args.title,
      category: args.category,
      priority: args.priority,
    }),
  });
}

export const toolDeclarations: FunctionDeclaration[] = [
  findExpertDeclaration,
  searchIncidentsDeclaration,
  raiseIncidentDeclaration,
];

export const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  find_expert: findExpert,
  search_incidents: searchIncidents,
  raise_incident: raiseIncident,
};
