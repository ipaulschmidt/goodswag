import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="no-print border-b-2 border-ink bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Non-Boring<span className="text-accent">&nbsp;Swag</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-accent" activeProps={{ className: "text-accent" }}>
            New event
          </Link>
          <Link
            to="/library"
            className="hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Event library
          </Link>
        </nav>
      </div>
    </header>
  );
}
