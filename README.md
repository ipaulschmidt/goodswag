# Swag Genius

Build a web app called "Non-Boring Swag" that helps event marketers pick tradeshow and conference swag that isn't the usual junk drawer filler, sized to a real budget.

CORE FLOW

1. New Event intake form

   Required fields:

   - Event name

   - Standard budget per item

   All other fields are pre-filled with editable defaults so the form can be submitted with just the two fields above:

   - Event URL: blank, optional

   - Industry/vertical and audience context: not asked upfront, left blank. The AI determines this during research from the event name (and URL if given). A "context notes" free text field stays available for the user to override or add detail if they already know something specific.

   - Standard budget range: default min = 70% of the entered per-item budget, default max = the entered per-item budget, both editable

   - Reach/stretch budget max: default = 4x the entered per-item budget, editable

   - Booth size: default "Standard 10x10", editable (tabletop / standard 10x10 / island / other)

   - Staffing available for an interactive activation: default Yes, editable

   - Estimated attendee volume: default blank (treated as unknown, AI estimates from event research if left blank)

   - Brand colors or guidelines: default blank, optional

2. Generation step (background job with a loading state)

   Calls an AI model with live web search enabled to:

   a. Research the event itself: attendee profile, industry, typical exhibitor patterns (using context notes as override/supplement if provided)

   b. Cross-reference against a "common boring swag" baseline (see reference list below) plus whatever this event's context suggests exhibitors usually hand out

   c. Research current trend signals relevant to the event's audience

   d. Generate 3-5 standard-tier swag recommendations that fit inside the given budget and actively avoid the boring baseline

   e. Generate 1-3 reach-tier recommendations above budget, for exhibitors willing to spend more for standout impact

   f. For every recommendation, search for and include real supplier or vendor links

3. Results page

   URL: each event gets one persistent, unique shareable URL (e.g. /r/[shareId]) generated at first save. This is the same URL used internally and shared with clients; it always reflects the current state of the event's recommendations.

   Top of page: event name, and the inputs used to generate the results (budget range, reach budget, booth size, staffing, attendee volume, industry as detected) so anyone viewing knows what these were built around.

   Two sections below: Standard and Reach. Each item as a card: name, short description, why it fits (trend or audience tie-in), an engagement type badge, estimated per-unit price, and supplier links.

   Buttons on this page:

   - Copy shareable link

   - Export as PDF (same content as the page: inputs at top, then both tiers, dismissed items excluded)

   - Edit mode toggle

   Edit mode:

   - Each card gets a dismiss control (X or cross-out styling) with an optional short reason field

   - Dismissed items are visually marked, excluded from the client-facing/public rendering and from PDF export, but not deleted

   - A "Refresh" button per tier regenerates only enough new items to bring that tier back to its target count, using the kept items and the dismissed items (and reasons, if given) as context so it doesn't resuggest something already rejected or duplicate something already kept

4. Event Library

   - List of saved events (name, industry as detected, budget, date created, shareable link)

   - Click into an event to reach its results/edit page

   - Duplicate an event as a starting template for a similar future show

   - Edit intake details and regenerate from scratch if the event itself changes

DATA MODEL

events table: id, name, event_url, context_notes, industry_detected, standard_budget_min, standard_budget_max, reach_budget_max, booth_size, staffing_available, attendee_volume, brand_colors, share_slug (unique), created_at

swag_recommendations table: id, event_id (FK), tier (standard/reach), item_name, description, rationale, engagement_type, estimated_price, supplier_links (array of {name, url}), trend_tie_in, status (active/dismissed), dismiss_reason, created_at

ENGAGEMENT TYPE (fixed categories, tag every recommendation with one)

- grab_and_go: picked up, no interaction

- personalized: customized for the recipient (name, color, size) with minimal staffing

- interactive_onsite: created, built, or experienced at the booth (engraving, live printing, AI photo booth, build-a-something station, spin to win)

Weight standard-tier recommendations toward personalized and interactive_onsite over grab_and_go, and flag in the UI when an interactive_onsite item needs staffing or equipment the intake form said isn't available.

BORING SWAG BASELINE (seed this as a reference list the AI checks against, expandable later)

Pens, tote bags, koozies, stress balls, phone chargers/cables, water bottles, notepads, mints/candy, USB drives, sunglasses, lanyards, mousepads, generic phone stands, branded sticky notes

OUTPUT CONTRACT

Each AI generation call should return structured JSON matching the swag_recommendations fields above, not freeform text, so results render directly into the page.

V1 SCOPE

- Skip live price syncing with vendor sites, an estimated price plus a link is enough for now

- No multi-user sharing or accounts required for the public share link, it just needs to be unguessable (long random slug)

- No login required to view a shared link; editing still requires being in the authenticated app

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://goodswag.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c1a1b2c1-1c8d-4fea-8786-c8eb279f31bc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
