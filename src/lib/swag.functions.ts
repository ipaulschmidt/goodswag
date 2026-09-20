import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { generateRecommendations, type GeneratedItem } from "./ai-swag.server";
import type { Database } from "@/integrations/supabase/types";

export const STANDARD_TARGET = 4;
export const REACH_TARGET = 2;

function serverSupabase() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key } },
  });
}

function rowsFor(
  eventId: string,
  tier: "standard" | "reach",
  items: GeneratedItem[],
  staffingAvailable: boolean,
) {
  return items.map((item) => ({
    event_id: eventId,
    tier,
    item_name: item.item_name,
    description: item.description,
    rationale: item.rationale,
    trend_tie_in: item.trend_tie_in ?? null,
    engagement_type: item.engagement_type,
    estimated_price: item.estimated_price ?? null,
    supplier_links: (item.supplier_links ?? []).filter((l) => l?.url?.startsWith("http")),
    needs_unavailable_staffing: !staffingAvailable && !!item.requires_staffing_or_equipment,
    status: "active",
  }));
}

const GenerateInput = z.object({
  eventId: z.string().uuid(),
  mode: z.enum(["full", "refresh"]),
  tier: z.enum(["standard", "reach"]).optional(),
});

/**
 * Researches the event with live web search and writes recommendations.
 * mode "full" replaces everything; mode "refresh" tops one tier back up to target.
 */
export const generateForEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");
    const supabase = serverSupabase();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", data.eventId)
      .maybeSingle();
    if (eventError) throw new Error(eventError.message);
    if (!event) throw new Error("Event not found.");

    await supabase
      .from("events")
      .update({ generation_status: "generating", generation_error: null })
      .eq("id", event.id);

    try {
      const { data: existing } = await supabase
        .from("swag_recommendations")
        .select("*")
        .eq("event_id", event.id);
      const all = existing ?? [];

      let standardCount = STANDARD_TARGET;
      let reachCount = REACH_TARGET;

      if (data.mode === "refresh") {
        const tier = data.tier ?? "standard";
        const activeInTier = all.filter((r) => r.tier === tier && r.status === "active").length;
        const missing = Math.max(1, (tier === "standard" ? STANDARD_TARGET : REACH_TARGET) - activeInTier);
        standardCount = tier === "standard" ? missing : 0;
        reachCount = tier === "reach" ? missing : 0;
      }

      const result = await generateRecommendations(
        {
          name: event.name,
          event_url: event.event_url,
          context_notes: event.context_notes,
          standard_budget_min: Number(event.standard_budget_min),
          standard_budget_max: Number(event.standard_budget_max),
          reach_budget_max: Number(event.reach_budget_max),
          booth_size: event.booth_size,
          staffing_available: event.staffing_available,
          attendee_volume: event.attendee_volume,
          brand_colors: event.brand_colors,
          standardCount,
          reachCount,
          keptItems:
            data.mode === "refresh"
              ? all
                  .filter((r) => r.status === "active")
                  .map((r) => ({
                    tier: r.tier,
                    item_name: r.item_name,
                    description: r.description,
                  }))
              : [],
          dismissedItems:
            data.mode === "refresh"
              ? all
                  .filter((r) => r.status === "dismissed")
                  .map((r) => ({
                    tier: r.tier,
                    item_name: r.item_name,
                    dismiss_reason: r.dismiss_reason,
                  }))
              : [],
        },
        apiKey,
      );

      if (data.mode === "full") {
        await supabase.from("swag_recommendations").delete().eq("event_id", event.id);
      }

      const rows = [
        ...rowsFor(event.id, "standard", result.standard.slice(0, standardCount), event.staffing_available),
        ...rowsFor(event.id, "reach", result.reach.slice(0, reachCount), event.staffing_available),
      ];
      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("swag_recommendations").insert(rows);
        if (insertError) throw new Error(insertError.message);
      }

      await supabase
        .from("events")
        .update({
          generation_status: "ready",
          generation_error: null,
          industry_detected: event.industry_detected || result.industry_detected || null,
          attendee_volume: event.attendee_volume || result.attendee_volume_estimate || null,
        })
        .eq("id", event.id);

      return { ok: true as const, added: rows.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      await supabase
        .from("events")
        .update({ generation_status: "error", generation_error: message })
        .eq("id", event.id);
      throw new Error(message);
    }
  });
