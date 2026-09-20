import { supabase } from "@/integrations/supabase/client";

export type SupplierLink = { name: string; url: string };

export type Recommendation = {
  id: string;
  event_id: string;
  tier: "standard" | "reach";
  item_name: string;
  description: string;
  rationale: string;
  engagement_type: "grab_and_go" | "personalized" | "interactive_onsite";
  estimated_price: number | null;
  supplier_links: SupplierLink[];
  trend_tie_in: string | null;
  needs_unavailable_staffing: boolean;
  status: "active" | "dismissed";
  dismiss_reason: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  name: string;
  event_url: string | null;
  context_notes: string | null;
  industry_detected: string | null;
  standard_budget_min: number;
  standard_budget_max: number;
  reach_budget_max: number;
  booth_size: string;
  staffing_available: boolean;
  attendee_volume: string | null;
  brand_colors: string | null;
  share_slug: string;
  generation_status: "pending" | "generating" | "ready" | "error";
  generation_error: string | null;
  created_at: string;
};

export function makeShareSlug() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 28);
}

export type EventDraft = {
  name: string;
  event_url: string | null;
  context_notes: string | null;
  standard_budget_min: number;
  standard_budget_max: number;
  reach_budget_max: number;
  booth_size: string;
  staffing_available: boolean;
  attendee_volume: string | null;
  brand_colors: string | null;
};

export async function createEvent(draft: EventDraft) {
  const { data, error } = await supabase
    .from("events")
    .insert({ ...draft, share_slug: makeShareSlug(), generation_status: "pending" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as EventRow;
}

export async function updateEvent(id: string, draft: Partial<EventDraft>) {
  const { data, error } = await supabase
    .from("events")
    .update(draft)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as EventRow;
}

export async function duplicateEvent(source: EventRow) {
  return createEvent({
    name: `${source.name} (copy)`,
    event_url: source.event_url,
    context_notes: source.context_notes,
    standard_budget_min: source.standard_budget_min,
    standard_budget_max: source.standard_budget_max,
    reach_budget_max: source.reach_budget_max,
    booth_size: source.booth_size,
    staffing_available: source.staffing_available,
    attendee_volume: source.attendee_volume,
    brand_colors: source.brand_colors,
  });
}

export async function listEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EventRow[];
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getEventBySlug(slug: string) {
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("share_slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) return null;

  const { data: recs, error: recsError } = await supabase
    .from("swag_recommendations")
    .select("*")
    .eq("event_id", (event as unknown as EventRow).id)
    .order("created_at", { ascending: true });
  if (recsError) throw new Error(recsError.message);

  return {
    event: event as unknown as EventRow,
    recommendations: (recs ?? []) as unknown as Recommendation[],
  };
}

export async function setRecommendationStatus(
  id: string,
  status: "active" | "dismissed",
  dismissReason?: string | null,
) {
  const { error } = await supabase
    .from("swag_recommendations")
    .update({ status, dismiss_reason: status === "dismissed" ? (dismissReason ?? null) : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export const ENGAGEMENT_LABELS: Record<Recommendation["engagement_type"], string> = {
  grab_and_go: "Grab & go",
  personalized: "Personalized",
  interactive_onsite: "Interactive on-site",
};
