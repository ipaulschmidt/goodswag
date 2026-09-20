import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Copy, FileDown, Loader2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { SwagCard } from "@/components/SwagCard";
import { Button } from "@/components/ui/button";
import { getEventBySlug, setRecommendationStatus, type Recommendation } from "@/lib/events";
import { generateForEvent, REACH_TARGET, STANDARD_TARGET } from "@/lib/swag.functions";

export const Route = createFileRoute("/r/$shareId")({
  head: () => ({
    meta: [
      { title: "Swag recommendations — Non-Boring Swag" },
      {
        name: "description",
        content: "Standard and reach-tier tradeshow swag picks built around this event's budget.",
      },
      { property: "og:title", content: "Swag recommendations — Non-Boring Swag" },
      {
        property: "og:description",
        content: "Standard and reach-tier tradeshow swag picks built around this event's budget.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { shareId } = Route.useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const started = useRef(false);
  const generate = useServerFn(generateForEvent);

  const query = useQuery({
    queryKey: ["event", shareId],
    queryFn: () => getEventBySlug(shareId),
  });

  const runGeneration = useMutation({
    mutationFn: (vars: { mode: "full" | "refresh"; tier?: "standard" | "reach" }) =>
      generate({ data: { eventId: query.data!.event.id, ...vars } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", shareId] }),
    onError: (error: Error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ["event", shareId] });
    },
  });

  const event = query.data?.event;

  useEffect(() => {
    if (!event || started.current) return;
    if (event.generation_status === "pending") {
      started.current = true;
      runGeneration.mutate({ mode: "full" });
    }
  }, [event, runGeneration]);

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "dismissed"; reason?: string }) =>
      setRecommendationStatus(vars.id, vars.status, vars.reason || null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", shareId] }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (query.isLoading) {
    return <CenteredNote text="Loading..." />;
  }

  if (!query.data || !event) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <CenteredNote text="This link doesn't match any saved event." />
      </div>
    );
  }

  const recs = query.data.recommendations;
  const busy = runGeneration.isPending || event.generation_status === "generating";
  const visible = (tier: "standard" | "reach") =>
    recs.filter((r) => r.tier === tier && (editing || r.status === "active"));

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Shareable link copied.");
    } catch {
      toast.error("Couldn't copy — copy it from the address bar.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="block-card p-5">
          <p className="eyebrow text-highlight">Swag plan</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{event.name}</h1>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <Fact label="Industry (detected)" value={event.industry_detected || "Researching..."} />
            <Fact
              label="Standard budget"
              value={`$${Number(event.standard_budget_min)} – $${Number(event.standard_budget_max)} / unit`}
            />
            <Fact label="Reach budget" value={`up to $${Number(event.reach_budget_max)} / unit`} />
            <Fact label="Booth size" value={event.booth_size} />
            <Fact label="Staffing for activations" value={event.staffing_available ? "Yes" : "No"} />
            <Fact label="Attendee volume" value={event.attendee_volume || "Unknown"} />
            {event.brand_colors && <Fact label="Brand notes" value={event.brand_colors} />}
            {event.event_url && <Fact label="Event URL" value={event.event_url} />}
            {event.context_notes && <Fact label="Context notes" value={event.context_notes} />}
          </dl>

          <div className="no-print mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink}>
              <Copy className="size-4" /> Copy shareable link
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <FileDown className="size-4" /> Export as PDF
            </Button>
            <Button variant={editing ? "default" : "outline"} onClick={() => setEditing((v) => !v)}>
              <Pencil className="size-4" /> {editing ? "Done editing" : "Edit mode"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/library">Event library</Link>
            </Button>
          </div>
        </div>

        {busy && (
          <div className="block-card mt-6 flex items-center gap-3 p-5">
            <Loader2 className="size-5 animate-spin text-highlight" />
            <div>
              <p className="font-display font-bold">Researching the event and current trends</p>
              <p className="text-sm text-muted-foreground">
                Reading up on the audience, checking what exhibitors already hand out, and pricing
                real suppliers. This takes a minute or two.
              </p>
            </div>
          </div>
        )}

        {event.generation_status === "error" && !busy && (
          <div className="block-card mt-6 border-destructive p-5">
            <p className="font-display font-bold text-destructive">That generation didn&apos;t finish</p>
            <p className="mt-1 text-sm text-muted-foreground">{event.generation_error}</p>
            <Button className="mt-3" onClick={() => runGeneration.mutate({ mode: "full" })}>
              Try again
            </Button>
          </div>
        )}

        <TierSection
          title="Standard tier"
          note={`Inside $${Number(event.standard_budget_min)}–$${Number(event.standard_budget_max)} per unit`}
          items={visible("standard")}
          target={STANDARD_TARGET}
          editing={editing}
          busy={busy}
          onRefresh={() => runGeneration.mutate({ mode: "refresh", tier: "standard" })}
          onDismiss={(id, reason) => statusMutation.mutate({ id, status: "dismissed", reason })}
          onRestore={(id) => statusMutation.mutate({ id, status: "active" })}
        />

        <TierSection
          title="Reach tier"
          note={`Above budget, up to $${Number(event.reach_budget_max)} per unit`}
          items={visible("reach")}
          target={REACH_TARGET}
          editing={editing}
          busy={busy}
          onRefresh={() => runGeneration.mutate({ mode: "refresh", tier: "reach" })}
          onDismiss={(id, reason) => statusMutation.mutate({ id, status: "dismissed", reason })}
          onRestore={(id) => statusMutation.mutate({ id, status: "active" })}
        />
      </main>
    </div>
  );
}

function TierSection(props: {
  title: string;
  note: string;
  items: Recommendation[];
  target: number;
  editing: boolean;
  busy: boolean;
  onRefresh: () => void;
  onDismiss: (id: string, reason: string) => void;
  onRestore: (id: string) => void;
}) {
  const activeCount = props.items.filter((i) => i.status === "active").length;
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{props.title}</h2>
          <p className="text-sm text-muted-foreground">{props.note}</p>
        </div>
        {props.editing && (
          <Button
            variant="outline"
            className="no-print"
            disabled={props.busy || activeCount >= props.target}
            onClick={props.onRefresh}
          >
            <RefreshCw className="size-4" /> Refresh to {props.target}
          </Button>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {props.items.map((rec) => (
          <SwagCard
            key={rec.id}
            rec={rec}
            editing={props.editing}
            onDismiss={props.onDismiss}
            onRestore={props.onRestore}
          />
        ))}
      </div>
      {props.items.length === 0 && !props.busy && (
        <p className="mt-3 text-sm text-muted-foreground">Nothing here yet.</p>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-ink bg-surface px-3 py-2">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium break-words">{value}</dd>
    </div>
  );
}

function CenteredNote({ text }: { text: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-muted-foreground">
      {text}
    </div>
  );
}
