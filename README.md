# Non-Boring Swag

**Tradeshow and conference swag ideas people actually keep, sized to your real budget.**

Live app: https://goodswag.lovable.app

Most booth giveaways end up in a junk drawer: pens, tote bags, stress balls, water bottles. Non-Boring Swag researches your event and its audience, then suggests memorable alternatives that fit what you want to spend, with real supplier links for each idea.

---

## How it works

1. **Tell it about your event.** Enter the event name and what you'd like to spend per item. Everything else is optional: event website, notes about the audience, booth size, whether you'll have staff for a hands-on activity, expected attendance, and brand guidelines.
2. **It does the research.** The app looks up the event online to learn who attends, what industry it serves, and what exhibitors usually hand out. It checks current trends for that audience and steers clear of a list of overused giveaways.
3. **Get two sets of ideas.**
   - **Within budget:** ideas inside your usual price range.
   - **Standout:** a few bigger ideas, up to your maximum price for a standout item.

Each idea shows what it is, why it fits this audience, an estimated price per unit, links to suppliers, and how people engage with it:

| Type | What it means |
| --- | --- |
| **Grab and go** | Picked up from the table, no interaction needed |
| **Personalized** | Customized for each person (name, color, size) with little staff time |
| **Interactive on site** | Made or experienced at the booth, such as live engraving, printing, or a photo booth |

Ideas lean toward personalized and interactive options. If an idea needs staff or equipment you said you won't have, it's flagged.

---

## Using the results page

Every event gets its own private link that is hard to guess. Anyone with the link can view the results; no account is needed.

- **Copy link:** share the recommendations with your team or a client.
- **Export PDF:** download a clean, printable version.
- **Edit mode:**
  - Dismiss ideas you don't want, with an optional reason. Dismissed ideas are hidden from the shared view and the PDF but are not deleted, so you can restore them later.
  - **Refresh** a section to fill the empty slots with new ideas. The app uses what you kept and what you dismissed (and why) so it won't repeat itself.

## Event library

- See all your saved events with industry, budget, and creation date.
- **Duplicate** an event to use as a starting point for a similar show.
- **Edit details** and regenerate everything if the event changes.

---

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite) with server functions
- Tailwind CSS v4 and shadcn/ui
- Postgres database with row-level security
- AI model with live web search, returning structured JSON so results render straight into the page

## Running locally

Requires Node.js 20+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
cp .env.example .env   # fill in your own values
npm install
npm run dev
```

AI generation needs an API key provided as a server environment variable (`LOVABLE_API_KEY`). It is never stored in the repository.

## Roadmap

- Live price syncing with supplier sites
- Sign-in for editing, while share links stay public
- Expandable list of overused giveaways to avoid
