/**
 * Lovable AI Gateway research + recommendation generation (server-only).
 * Uses the Responses API with live web search, streaming, and strict JSON output.
 */

export type EngagementType = "grab_and_go" | "personalized" | "interactive_onsite";

export type GeneratedItem = {
  item_name: string;
  description: string;
  rationale: string;
  trend_tie_in: string;
  engagement_type: EngagementType;
  estimated_price: number;
  requires_staffing_or_equipment: boolean;
  supplier_links: { name: string; url: string }[];
};

export type GenerationResult = {
  industry_detected: string;
  attendee_volume_estimate: string;
  standard: GeneratedItem[];
  reach: GeneratedItem[];
};

export const BORING_BASELINE = [
  "pens",
  "tote bags",
  "koozies",
  "stress balls",
  "phone chargers/cables",
  "water bottles",
  "notepads",
  "mints/candy",
  "USB drives",
  "sunglasses",
  "lanyards",
  "mousepads",
  "generic phone stands",
  "branded sticky notes",
];

const itemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "item_name",
    "description",
    "rationale",
    "trend_tie_in",
    "engagement_type",
    "estimated_price",
    "requires_staffing_or_equipment",
    "supplier_links",
  ],
  properties: {
    item_name: { type: "string" },
    description: { type: "string" },
    rationale: { type: "string" },
    trend_tie_in: { type: "string" },
    engagement_type: {
      type: "string",
      enum: ["grab_and_go", "personalized", "interactive_onsite"],
    },
    estimated_price: { type: "number" },
    requires_staffing_or_equipment: { type: "boolean" },
    supplier_links: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: { name: { type: "string" }, url: { type: "string" } },
      },
    },
  },
} as const;

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["industry_detected", "attendee_volume_estimate", "standard", "reach"],
  properties: {
    industry_detected: { type: "string" },
    attendee_volume_estimate: { type: "string" },
    standard: { type: "array", items: itemSchema },
    reach: { type: "array", items: itemSchema },
  },
} as const;

export type GenerationInput = {
  name: string;
  event_url?: string | null;
  context_notes?: string | null;
  standard_budget_min: number;
  standard_budget_max: number;
  reach_budget_max: number;
  booth_size: string;
  staffing_available: boolean;
  attendee_volume?: string | null;
  brand_colors?: string | null;
  standardCount: number;
  reachCount: number;
  keptItems?: { tier: string; item_name: string; description: string }[];
  dismissedItems?: { tier: string; item_name: string; dismiss_reason?: string | null }[];
};

function buildPrompt(input: GenerationInput) {
  const kept = (input.keptItems ?? [])
    .map((k) => `- [${k.tier}] ${k.item_name}: ${k.description}`)
    .join("\n");
  const dismissed = (input.dismissedItems ?? [])
    .map(
      (d) =>
        `- [${d.tier}] ${d.item_name}${d.dismiss_reason ? ` (rejected because: ${d.dismiss_reason})` : ""}`,
    )
    .join("\n");

  return `You are a tradeshow swag strategist. Recommend conference/tradeshow giveaways that are memorable, not junk-drawer filler.

EVENT
- Name: ${input.name}
- Event URL: ${input.event_url || "(not provided)"}
- Extra context from the user (treat as override/supplement): ${input.context_notes || "(none)"}
- Booth size: ${input.booth_size}
- Staffing available for an interactive activation: ${input.staffing_available ? "YES" : "NO"}
- Estimated attendee volume: ${input.attendee_volume || "(unknown — estimate it from research)"}
- Brand colors / guidelines: ${input.brand_colors || "(none given)"}

BUDGET
- Standard tier per-unit budget: $${input.standard_budget_min} to $${input.standard_budget_max} (every standard item MUST fit inside this range)
- Reach tier per-unit budget: above $${input.standard_budget_max}, up to $${input.reach_budget_max}

DO THIS
1. Use web search to research this specific event: who attends, industry/vertical, exhibitor patterns, what giveaways are typical there.
2. Use web search for current swag/experiential trend signals relevant to that audience.
3. Actively AVOID this boring baseline and obvious variations of it: ${BORING_BASELINE.join(", ")}. Also avoid whatever this event's exhibitors clearly already hand out.
4. Produce exactly ${input.standardCount} standard-tier items and exactly ${input.reachCount} reach-tier items.
5. For every item, use web search to find 1-3 REAL supplier/vendor pages (promotional product suppliers, activation vendors, manufacturers). Use full https URLs you actually saw in search results. Never invent URLs.
6. Tag each item with exactly one engagement_type: grab_and_go, personalized, or interactive_onsite. Weight standard tier toward personalized and interactive_onsite; at most one grab_and_go in the standard tier.
7. Set requires_staffing_or_equipment=true when the item needs booth staff or on-site equipment to work.
8. estimated_price is per unit in USD.
9. rationale explains why it fits THIS audience; trend_tie_in names the trend or audience signal it rides.
10. industry_detected is a short label (e.g. "Healthcare IT"). attendee_volume_estimate is a short string (e.g. "~15,000 attendees").
${kept ? `\nALREADY KEPT — do not duplicate or near-duplicate these:\n${kept}` : ""}
${dismissed ? `\nALREADY REJECTED — do not suggest these or close variants again:\n${dismissed}` : ""}

Return JSON only, matching the schema.`;
}

export async function generateRecommendations(
  input: GenerationInput,
  apiKey: string,
): Promise<GenerationResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: buildPrompt(input),
      stream: true,
      store: false,
      tools: [{ type: "web_search" }],
      reasoning: { effort: "medium" },
      text: {
        format: {
          type: "json_schema",
          name: "swag_recommendations",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 400)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let finalText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let evt: {
        type?: string;
        delta?: string;
        response?: { output_text?: string; error?: { message?: string } };
        error?: { message?: string };
      };
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
        text += evt.delta;
      } else if (evt.type === "response.completed" && evt.response?.output_text) {
        finalText = evt.response.output_text;
      } else if (evt.type === "error" || evt.type === "response.failed") {
        throw new Error(evt.error?.message || evt.response?.error?.message || "AI stream failed");
      }
    }
  }

  const raw = (finalText || text).trim();
  if (!raw) throw new Error("The AI returned no recommendations. Please try again.");

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "");
  let parsed: GenerationResult;
  try {
    parsed = JSON.parse(cleaned) as GenerationResult;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("The AI response could not be read.");
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as GenerationResult;
  }

  return {
    industry_detected: parsed.industry_detected ?? "",
    attendee_volume_estimate: parsed.attendee_volume_estimate ?? "",
    standard: Array.isArray(parsed.standard) ? parsed.standard : [],
    reach: Array.isArray(parsed.reach) ? parsed.reach : [],
  };
}
