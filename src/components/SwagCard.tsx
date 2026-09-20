import { AlertTriangle, ExternalLink, Undo2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENGAGEMENT_LABELS, type Recommendation } from "@/lib/events";

type Props = {
  rec: Recommendation;
  editing: boolean;
  onDismiss: (id: string, reason: string) => void;
  onRestore: (id: string) => void;
};

export function SwagCard({ rec, editing, onDismiss, onRestore }: Props) {
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const dismissed = rec.status === "dismissed";

  return (
    <article
      className={`block-card p-5 ${dismissed ? "border-dashed opacity-60" : ""}`}
      aria-label={rec.item_name}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`font-display text-xl font-bold ${dismissed ? "line-through decoration-2" : ""}`}
        >
          {rec.item_name}
        </h3>
        {editing ? (
          dismissed ? (
            <Button variant="outline" size="sm" onClick={() => onRestore(rec.id)}>
              <Undo2 className="size-4" /> Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label={`Dismiss ${rec.item_name}`}
              onClick={() => setShowReason((v) => !v)}
            >
              <X className="size-4" />
            </Button>
          )
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border-2 border-ink bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
          {ENGAGEMENT_LABELS[rec.engagement_type]}
        </span>
        {rec.estimated_price != null && (
          <span className="rounded-full border-2 border-ink bg-surface px-2.5 py-1 font-semibold">
            ~${Number(rec.estimated_price).toFixed(2)} / unit
          </span>
        )}
        {rec.needs_unavailable_staffing && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-destructive px-2.5 py-1 font-semibold text-destructive">
            <AlertTriangle className="size-3.5" /> Needs staffing you said isn&apos;t available
          </span>
        )}
      </div>

      <p className="mt-3 text-sm">{rec.description}</p>

      <p className="mt-3 text-sm">
        <span className="eyebrow text-highlight">Why it fits</span>
        <br />
        {rec.rationale}
      </p>

      {rec.trend_tie_in && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="eyebrow">Trend tie-in</span>
          <br />
          {rec.trend_tie_in}
        </p>
      )}

      {rec.supplier_links.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">Suppliers</p>
          <ul className="mt-1 space-y-1">
            {rec.supplier_links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium underline decoration-highlight decoration-2 underline-offset-2"
                >
                  {link.name} <ExternalLink className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dismissed && rec.dismiss_reason && (
        <p className="mt-4 text-xs text-muted-foreground">Dismissed: {rec.dismiss_reason}</p>
      )}

      {editing && showReason && !dismissed && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="max-w-xs"
          />
          <Button
            size="sm"
            onClick={() => {
              onDismiss(rec.id, reason.trim());
              setShowReason(false);
            }}
          >
            Dismiss item
          </Button>
        </div>
      )}
    </article>
  );
}
