import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
import { createEvent } from "@/lib/events";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New event — Non-Boring Swag" },
      {
        name: "description",
        content:
          "Tell us the event and your per-item budget, and get tradeshow swag ideas worth keeping.",
      },
      { property: "og:title", content: "New event — Non-Boring Swag" },
      {
        property: "og:description",
        content:
          "Tell us the event and your per-item budget, and get tradeshow swag ideas worth keeping.",
      },
    ],
  }),
  component: IntakePage,
});

const BOOTH_SIZES = ["Tabletop", "Standard 10x10", "Island", "Other"];

function IntakePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [perItem, setPerItem] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [reachBudget, setReachBudget] = useState("");
  const [boothSize, setBoothSize] = useState("Standard 10x10");
  const [staffing, setStaffing] = useState(true);
  const [attendees, setAttendees] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [touched, setTouched] = useState({ min: false, max: false, reach: false });

  function handlePerItem(value: string) {
    setPerItem(value);
    const base = Number(value);
    if (!Number.isFinite(base) || base <= 0) return;
    if (!touched.min) setMinBudget((Math.round(base * 0.7 * 100) / 100).toString());
    if (!touched.max) setMaxBudget(base.toString());
    if (!touched.reach) setReachBudget((base * 4).toString());
  }

  const create = useMutation({
    mutationFn: async () => {
      const base = Number(perItem);
      const min = Number(minBudget || base * 0.7);
      const max = Number(maxBudget || base);
      const reach = Number(reachBudget || base * 4);
      return createEvent({
        name: name.trim(),
        event_url: eventUrl.trim() || null,
        context_notes: contextNotes.trim() || null,
        standard_budget_min: min,
        standard_budget_max: max,
        reach_budget_max: reach,
        booth_size: boothSize,
        staffing_available: staffing,
        attendee_volume: attendees.trim() || null,
        brand_colors: brandColors.trim() || null,
      });
    },
    onSuccess: (event) => {
      navigate({ to: "/r/$shareId", params: { shareId: event.share_slug } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Add the event name.");
      return;
    }
    const base = Number(perItem);
    if (!Number.isFinite(base) || base <= 0) {
      toast.error("Add a budget per item.");
      return;
    }
    create.mutate();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="eyebrow text-highlight">Stop handing out junk</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
          Swag people actually keep, priced for your budget.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Two fields is all we need. Everything else is pre-filled and editable, and the research
          fills in the rest from the event itself.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <div className="block-card space-y-5 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Event name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="HIMSS 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perItem">Standard budget per item (USD) *</Label>
                <Input
                  id="perItem"
                  type="number"
                  min="0"
                  step="0.5"
                  value={perItem}
                  onChange={(e) => handlePerItem(e.target.value)}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Event URL (optional)</Label>
              <Input
                id="url"
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Context notes (optional)</Label>
              <Textarea
                id="notes"
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
                placeholder="Anything you already know about the audience, or what you want to avoid."
              />
              <p className="text-xs text-muted-foreground">
                Leave blank and the industry and audience get detected from the event itself.
              </p>
            </div>
          </div>

          <div className="block-card space-y-5 p-5">
            <h2 className="font-display text-lg font-bold">Budget bands</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="min">Standard min</Label>
                <Input
                  id="min"
                  type="number"
                  value={minBudget}
                  onChange={(e) => {
                    setTouched((t) => ({ ...t, min: true }));
                    setMinBudget(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Standard max</Label>
                <Input
                  id="max"
                  type="number"
                  value={maxBudget}
                  onChange={(e) => {
                    setTouched((t) => ({ ...t, max: true }));
                    setMaxBudget(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reach">Reach / stretch max</Label>
                <Input
                  id="reach"
                  type="number"
                  value={reachBudget}
                  onChange={(e) => {
                    setTouched((t) => ({ ...t, reach: true }));
                    setReachBudget(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="block-card space-y-5 p-5">
            <h2 className="font-display text-lg font-bold">Booth reality check</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Booth size</Label>
                <Select value={boothSize} onValueChange={setBoothSize}>
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
                <Label htmlFor="attendees">Estimated attendee volume</Label>
                <Input
                  id="attendees"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Leave blank to have it estimated"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border-2 border-ink bg-surface px-4 py-3">
              <div>
                <Label htmlFor="staffing">Staff available for an interactive activation</Label>
                <p className="text-xs text-muted-foreground">
                  Turn off and we flag anything that needs booth staff or gear.
                </p>
              </div>
              <Switch id="staffing" checked={staffing} onCheckedChange={setStaffing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colors">Brand colors or guidelines (optional)</Label>
              <Input
                id="colors"
                value={brandColors}
                onChange={(e) => setBrandColors(e.target.value)}
                placeholder="Deep navy + safety orange, no gradients"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={create.isPending} className="w-full">
            {create.isPending ? "Saving event..." : "Generate swag recommendations"}
          </Button>
        </form>
      </main>
    </div>
  );
}
