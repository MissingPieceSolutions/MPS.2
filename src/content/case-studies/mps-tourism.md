---
title: "From 2 Hours to Minutes: Automating Tourism Quotations for [Client Name]"
slug: "mps-tourism-quotation-engine"
client: "[Client Name]"
client_display: "a Turkish tour operator"
industry: "Tourism & Travel"
services: ["AI Workflow Automation", "Custom AI Development"]
outcome_headline: "Quotation time reduced from ~2 hours to under 5 minutes"
tech_stack: ["n8n", "Supabase", "PostgreSQL", "Python", "python-docx", "Microsoft Word"]
featured: true
published: false
---

<!-- CLIENT NAME: confirm consent before replacing [Client Name] placeholder -->

Every quotation [Client Name] sent to a prospective client cost roughly two hours of senior staff time — manually cross-referencing hotel rate sheets, guide fees, entrance ticket prices, and a live exchange rate, then hand-assembling a Word document without a single automated check along the way. MPS replaced that entire process with a four-phase automated pipeline. The result: a complete, branded quotation delivered in under five minutes. That shift frees approximately 20 hours of operations time per week — capacity that now goes toward selling, not formatting.

## The Problem Before

The manual quotation process at [Client Name] was not just slow — it was structurally fragile. Each quote required pulling current rates from multiple supplier sources: hotel pricing tables split by room type and season, guide rates that varied by group size and language, vehicle costs tied to specific route segments, entrance fees for each site on the itinerary, restaurant notes, and extras. None of these sources talked to each other. A single quotation touched upward of 50 data points, all assembled by hand across multiple spreadsheets.

Currency fluctuation made the problem worse. [Client Name] priced in EUR and operated in TRY, which meant whoever was building the quote had to manually fetch the current EUR/TRY rate from the Turkish Central Bank (TCMB), record it, and apply it to every relevant line item. If that check was missed — or done at the start of a long session — the numbers could be stale before the document was even finished. The final step was Word formatting: opening a template, copying values from spreadsheets, adjusting layout manually, and hoping nothing was transposed or overwritten in the process. Each of these touchpoints was a place for errors to enter. Together, they formed a bottleneck that limited how many quotes the team could realistically produce in a day.

## What MPS Built

The speed gain is the most visible result, but the system that produces it runs across four coordinated phases — each delivering a concrete business capability that the previous process could not.

Supplier rates are now queryable in real time rather than scattered across disconnected spreadsheets. MPS built a Supabase-hosted PostgreSQL database covering every supplier category the operator uses: hotels (with seasonal rate bands), hotel room types and pricing tiers, guides and guide rates by group configuration, vehicle routes and route-specific pricing, entrance sites and entrance fees, restaurants, and extras. Every rate update goes into one place. Every quotation queries the same authoritative source.

The live EUR/TRY exchange rate is fetched automatically at quote generation time via a dedicated n8n workflow that calls the TCMB API and snapshots the returned rate with each quotation record. The operator never manually looks up an exchange rate again, and the rate used for any given quote is permanently recorded alongside it.

A business rules engine — implemented as a set of n8n workflows — applies margins, handles inclusions and exclusions, and assembles the pricing structure automatically from the queried data. What previously required a staff member to work through a spreadsheet formula chain now executes in seconds without human intervention.

Document generation is handled by a Python script using python-docx, which fills 56 token placeholders in a branded Microsoft Word template. The template covers multi-day itineraries up to 14 days, with per-day hotel, meal, activity, and transport details rendered consistently on every output. The completed document is then routed through an n8n email formatter workflow and delivered automatically — no manual attachment, no copy-paste into an email body.

Across the full pipeline, n8n coordinates 12 or more automated workflows that handle orchestration, rate fetching, business logic, document generation, and email delivery as a single uninterrupted sequence.

## Under the Hood: Technical Decisions That Matter

Three architectural choices in particular make this system durable rather than just fast.

Quotation records are immutable by design. Once a quote is generated and stored, a PostgreSQL trigger — `prevent_quote_modification()` — blocks any modification to that record. The rate snapshot, the exchange rate, the supplier selections, the final price — all of it is frozen at generation time. This creates an audit trail that can resolve disputes, satisfy accounting review, or support regulatory queries without any manual documentation effort. It also means the operator can reproduce any historical quotation exactly as it was delivered, regardless of how supplier rates have changed since.

Multi-language output is built into the data model rather than bolted on. Quotations can be generated in Spanish, English, or Turkish from the same underlying data, using a `translation_labels` table that handles all user-facing strings per language. A tour operator serving Spanish-speaking groups, English-speaking groups, and local Turkish clients does not need three separate systems — or three separate formatting passes. Language is selected at generation time; everything else is identical.

Sequential reference numbers follow a professional `MPS-YYYY-NNNN` format, generated via a PostgreSQL sequence and stored function. Every quotation gets a unique, predictable identifier that appears on the Word document and is traceable back to the database record. Client-facing documents look polished; operations-side tracking is automatic.

The four-phase pipeline architecture — Supplier Data Foundation, Pricing Calculation Engine, Itinerary Structure, Output Generation — keeps each concern isolated and independently testable. If a hotel adds a new seasonal rate tier, that change goes into the database and immediately flows through every subsequent quotation without touching the document generation layer. If the Word template needs a layout update, that change is isolated to the Python script without affecting the pricing logic. The system was built to be maintained, not just to run.

## The Result

[Client Name]'s quotation process now runs approximately 24 times faster than the manual baseline — from roughly two hours per quote to under five minutes. That is not a marginal improvement to an existing process; it is a different process entirely. The error vectors that came with manual rate lookups, spreadsheet cross-referencing, and Word copy-paste are gone. The exchange rate is always current and always recorded. The document always matches the data.

The capacity freed by that shift is the real business outcome. Senior operations staff who were previously occupied with quote assembly for a significant portion of their working week now have that time back. The pipeline handles parallel quotation runs without degradation — volume that would have previously required queuing or overtime now executes concurrently. The system's extensibility means new supplier categories, additional languages, or updated template designs can be added without rebuilding the core pipeline.

---

**Stack:** n8n · Supabase · PostgreSQL · Python · python-docx · Microsoft Word
