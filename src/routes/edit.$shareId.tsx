import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventBySlug, updateEvent } from "@/lib/events";
import { generateForEvent } from "@/lib/swag.functions";

export const Route = createFileRoute("/edit/$shareId")({
  head: () => ({
    meta: [
      { title: "Edit event details — Non-Boring Swag" },
      {
        name: "description",
        content: "Change the event details and regenerate the swag recommendations from scratch.",
      },
      { property: "og:title", content: "Edit event details — Non-Boring Swag" },
      {
        property: "og:description",
        content: "Change the event details and regenerate the swag recommendations from scratch.",
      },
    ],
  }),
  component: EditPage,
});

const BOOTH_SIZES = ["Tabletop", "Standard 10x10", "Island", "Other"];

function EditPage() {
  const { shareId } = Route.useParams();
  const navigate = useNavigate();
  const generate = useServerFn(generateForEvent);

  const query = useQuery({ queryKey: ["event", shareId], queryFn: () => getEventBySlug(shareId) });
  const event = query.data?.event;

  const [form, setForm] = useState({
    name: "",
    event_url: "",
    context_notes: "",
    standard_budget_min: "",
    standard_budget_max: "",
    reach_budget_max: "",
    booth_size: "Standard 10x10",
    staffing_available: true,
    attendee_volume: "",
    brand_colors: "",
  });

  useEffect(() => {
    if (!event) return;
    setForm({
      name: event.name,
      event_url: event.event_url ?? "",
      context_notes: event.context_notes ?? "",
      standard_budget_min: String(Number(event.standard_budget_min)),
      standard_budget_max: String(Number(event.standard_budget_max)),
      reach_budget_max: String(Number(event.reach_budget_max)),
      booth_size: event.booth_size,
      staffing_available: event.staffing_available,
      attendee_volume: event.attendee_volume ?? "",
      brand_colors: event.brand_colors ?? "",
    });
  }, [event]);

  const save = useMutation({
    mutationFn: async (regenerate: boolean) => {
      if (!event) throw new Error("Event not loaded.");
      await updateEvent(event.id, {
        name: form.name.trim(),
        event_url: form.event_url.trim() || null,
        context_notes: form.context_notes.trim() || null,
        standard_budget_min: Number(form.standard_budget_min),
        standard_budget_max: Number(form.standard_budget_max),
        reach_budget_max: Number(form.reach_budget_max),
        booth_size: form.booth_size,
        staffing_available: form.staffing_available,
        attendee_volume: form.attendee_volume.trim() || null,
        brand_colors: form.brand_colors.trim() || null,
      });
      if (regenerate) {
        await generate({ data: { eventId: event.id, mode: "full" } });
      }
    },
    onSuccess: () => {
      toast.success("Saved.");
      navigate({ to: "/r/$shareId", params: { shareId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">
          This link doesn&apos;t match any saved event.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Edit event details</h1>
        <p className="mt-2 text-muted-foreground">
          Save on its own to update the header, or regenerate to rebuild both tiers from scratch.
        </p>

        <div className="block-card mt-8 space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Event name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Event URL</Label>
              <Input
                id="url"
                value={form.event_url}
                onChange={(e) => setForm({ ...form, event_url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Context notes</Label>
            <Textarea
              id="notes"
              value={form.context_notes}
              onChange={(e) => setForm({ ...form, context_notes: e.target.value })}
            />
          </div>

          <div>
            <h2 className="font-display text-lg font-bold">What should each item cost?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most ideas stay in your usual range. Standout ideas may cost more, up to the limit
              below.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold">Usual price range</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Most recommendations will cost between these amounts per item.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min">Lowest price per item</Label>
              <Input
                id="min"
                type="number"
                value={form.standard_budget_min}
                onChange={(e) => setForm({ ...form, standard_budget_min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Highest price per item</Label>
              <Input
                id="max"
                type="number"
                value={form.standard_budget_max}
                onChange={(e) => setForm({ ...form, standard_budget_max: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t-2 border-ink pt-5">
            <div className="space-y-2 sm:max-w-[calc(50%-0.625rem)]">
              <Label htmlFor="reach">Maximum price for a standout item</Label>
              <Input
                id="reach"
                type="number"
                value={form.reach_budget_max}
                onChange={(e) => setForm({ ...form, reach_budget_max: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                A few special ideas can exceed your usual range, but not this amount.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Booth size</Label>
              <Select
                value={form.booth_size}
                onValueChange={(value) => setForm({ ...form, booth_size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOTH_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Attendee volume</Label>
              <Input
                id="attendees"
                value={form.attendee_volume}
                onChange={(e) => setForm({ ...form, attendee_volume: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border-2 border-ink bg-surface px-4 py-3">
            <Label htmlFor="staffing">Staff available for an interactive activation</Label>
            <Switch
              id="staffing"
              checked={form.staffing_available}
              onCheckedChange={(checked) => setForm({ ...form, staffing_available: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="colors">Brand colors or guidelines</Label>
            <Input
              id="colors"
              value={form.brand_colors}
              onChange={(e) => setForm({ ...form, brand_colors: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(false)}>
            Save details
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate(true)}>
            {save.isPending ? "Working..." : "Save & regenerate from scratch"}
          </Button>
        </div>
      </main>
    </div>
  );
}
