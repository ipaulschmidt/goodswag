import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, CopyPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { deleteEvent, duplicateEvent, listEvents, type EventRow } from "@/lib/events";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Event library — Non-Boring Swag" },
      {
        name: "description",
        content: "Every saved event, its detected industry, budget, and shareable swag link.",
      },
      { property: "og:title", content: "Event library — Non-Boring Swag" },
      {
        property: "og:description",
        content: "Every saved event, its detected industry, budget, and shareable swag link.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const events = useQuery({ queryKey: ["events"], queryFn: listEvents });

  const duplicate = useMutation({
    mutationFn: (source: EventRow) => duplicateEvent(source),
    onSuccess: (created) => {
      toast.success("Duplicated — generate when you're ready.");
      navigate({ to: "/r/$shareId", params: { shareId: created.share_slug } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${slug}`);
      toast.success("Shareable link copied.");
    } catch {
      toast.error("Couldn't copy that link.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Event library</h1>
        <p className="mt-2 text-muted-foreground">
          Every show you&apos;ve built a swag plan for. Duplicate one as a template for the next
          show.
        </p>

        {events.isLoading && <p className="mt-8 text-muted-foreground">Loading...</p>}

        {events.data?.length === 0 && (
          <div className="block-card mt-8 p-6">
            <p className="font-display font-bold">No events yet.</p>
            <Button className="mt-3" asChild>
              <Link to="/">Start a new event</Link>
            </Button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {events.data?.map((event) => (
            <div key={event.id} className="block-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to="/r/$shareId"
                    params={{ shareId: event.share_slug }}
                    className="font-display text-xl font-bold underline decoration-highlight decoration-2 underline-offset-4"
                  >
                    {event.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.industry_detected || "Industry pending"} · $
                    {Number(event.standard_budget_min)}–${Number(event.standard_budget_max)} / unit ·
                    created {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyLink(event.share_slug)}>
                    <Copy className="size-4" /> Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={duplicate.isPending}
                    onClick={() => duplicate.mutate(event)}
                  >
                    <CopyPlus className="size-4" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => remove.mutate(event.id)}
                    aria-label={`Delete ${event.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
