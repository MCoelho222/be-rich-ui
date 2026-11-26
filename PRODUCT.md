# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brazilian households (couples and families) who share their money: joint and individual bank accounts, cash, credit and debit cards, and recurring bills and incomes. Every member of a household has the same permissions.

Rollout is staged. First the owner's own household on a self-hosted install, then other households like it once the product has proven itself. Work done now should not assume a single household, and it should not need marketing or onboarding aimed at strangers yet.

## Product Purpose

Be Rich shows a household where its money stands now and where it is heading. It answers five questions (specs/dashboard.md §1): how much we have right now, how this period is going, where the money goes, whether we'll be fine in the coming months, and what is waiting on us (overdue fixed entries, the next card bills).

Success means the household trusts the numbers enough to make decisions with them, without keeping a spreadsheet alongside.

## Positioning

Four things together, which generic finance apps (Mobills, Organizze, spreadsheets) don't model this faithfully:

- **Forward projection:** the balance month by month, including projected fixed entries and installments, and the month it would go negative.
- **Credit card truth:** statement closing and due dates, installments and business-day adjustments, so each purchase lands on the bill it really belongs to (schemas.md §10.2–10.3).
- **Fixed entries:** recurring bills and incomes with projected occurrences and overdue tracking.
- **A shared household:** several members with equal access, who spent or received each entry, and Me/Everyone views. Balances always belong to the household.

## Operating Context

- Members mostly open the app for a **weekly or monthly review**, sitting at a desktop to reconcile and plan ahead, and **before a decision**, to check whether something fits this month or the next. Quick entry right after spending is not the main moment.
- The dashboard view (period, account, Me/Everyone) lives in the URL and is remembered in the browser, so a shared link opens the same view.
- Deployment is Docker behind Caddy, with the UI and the FastAPI backend (`be-rich-api`) on one origin.
- The specs in `specs/` (and `be-rich-api/specs/`) are the source of truth for behavior and business rules.

## Capabilities and Constraints

- Pages: Dashboard, Entries, Fixed, Accounts (with cards), Categories, Settings (household, members, invitations), plus the public auth pages (login, signup, forgot/reset password, invite).
- **Languages:** Portuguese (Brazil) and English, toggled live. Every string comes from `messages/en.json` / `messages/pt.json`, with identical keys enforced by `pnpm lint`. Built-in categories follow the language; user data is never translated.
- **Formats stay Brazilian in both languages:** `R$ 1.234,56`, `05/12/2026`, timezone `America/Sao_Paulo`.
- **Money:** decimal or integer cents, never floating point. Amounts are positive, and the entity decides the direction. Currencies are BRL, USD and EUR, and totals show in the household's default currency with disclosed conversions.
- **Projected values** are always marked as projected (a `~` prefix, hatched bar segments), never shown as if they had happened.
- **Themes:** System, Light and Dark, held in a cookie so the first paint is right.
- Stack: Next.js 16 (App Router), React 19, Tailwind 4, Radix/shadcn primitives, TanStack Query, react-hook-form + zod, Recharts, next-intl, pnpm, Node 26.
- Undecided: whether a hosted multi-household offering will exist, and in what form.

## Brand Commitments

- Name: **Be Rich**. Tagline: "Your household's money, clear."
- Logo: a rounded tile holding a rising line with an arrow tip; the lockup is "Be **Rich**" with "Rich" emphasized (specs/frontend.md §1.6; `public/logo.svg`, `app/icon.svg`, `components/brand/Logo.tsx`).
- Voice: plain, direct and calm. Short sentences that say what happens ("The link is valid for 1 hour."), no jargon and no hype.

## Evidence on Hand

- Approved specs: `specs/frontend.md`, `specs/dashboard.md`, `specs/schemas.md`, `specs/ui-behavior.md`.
- No testimonials, users beyond the owner's household, metrics or press exist. Don't fabricate any.

## Product Principles

1. **Trustworthy numbers first.** Every figure must be exact and traceable to its rule. Never round away, hide or blur money.
2. **Show the future honestly.** Projections are a core feature, so they are always clearly marked as projected and never mixed up with what already happened.
3. **The household is the unit.** Design for shared visibility and equal members. Per-person views filter flows, never balances.
4. **Built for review and decisions.** Optimize for scanning a period, comparing months and answering "can we afford it?", rather than speed of entry.
5. **Bilingual by construction.** EN and PT are equals, and Brazilian formats hold in both.

## Accessibility & Inclusion

- WCAG AA text contrast (4.5:1) in both themes.
- Color is never the only signal: amounts carry a sign or label, and projected values carry `~`.
- Motion is limited to short fades and slides, and it is disabled under `prefers-reduced-motion`.
- Controls are 40px tall on phones for touch, and there is a keyboard shortcut (`N`) for a new entry.
