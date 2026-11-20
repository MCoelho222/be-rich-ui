# Frontend

**Status:** approved.

**Scope:** this file covers how the app looks and how it is built: the design language, languages, the app shell, routes, each page's layout, and the technical architecture.
- Form rules, validation and interactions are in [ui-behavior.md](ui-behavior.md). The dashboard is in [dashboard.md](dashboard.md). This file points to both instead of repeating them.
- Endpoints are in `be-rich-api/specs/api.md`, and authentication flows in `be-rich-api/specs/auth.md`.

---

## 1. Design language

The redesign keeps the current look (a dark slate interface, Geist, emerald for income, rose for expenses, blue for fixed entries, and the big money numbers) and makes it consistent.

### 1.1 Color tokens and themes

The colors in `config/colors.ts` become CSS variables in `app/globals.css`, exposed to Tailwind through `@theme`. Components use the tokens (`text-income`, `bg-surface`), never raw palette classes. Each token has a dark and a light value.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | slate-950 `#0b1120` | `#f6f7f9` | Page background |
| `--surface` | slate-900 `#0f172a` | white | Cards, sidebar, dialogs |
| `--surface-2` | slate-800 `#1e293b` | slate-100 | Table headers, inputs, hovered rows |
| `--border` | white 8% | slate-900 8% | Card and input borders, dividers |
| `--text` | slate-100 | slate-900 | Main text and numbers |
| `--text-muted` | slate-400 | slate-600 | Labels, secondary text |
| `--text-faint` | slate-500 | slate-400 | Placeholders and disabled text only |
| `--income` | emerald-400 | emerald-700 | Income amounts and tab (bars use emerald-500 in light) |
| `--expense` | rose-400 | rose-600 | Expense amounts and tab, chart bars |
| `--fixed` | blue-400 | blue-600 | The fixed badge and fixed share |
| `--negative` | rose-500 | rose-600 | Negative balances, the "goes negative" marker |
| `--warning` | amber-400 | amber-700 | Overdue panel, unconverted-currency warning |
| `--brand` / `--on-brand` | emerald-400 / emerald-950 | emerald-700 / white | Primary buttons, focus rings, active navigation, the logo tile. (Named `brand` because shadcn already uses `accent` for hover backgrounds.) |

- Text tokens meet WCAG AA contrast (4.5:1) on `--surface` in both themes. That is why light mode uses the darker 600/700 shades. Color is never the only signal: amounts also carry a sign or a label, and projected values carry `~`.
- The category palette (8 colors) is the same in both themes.

### 1.2 Theme (dark and light)

- **Three options:** System (the default, which follows the device), Light and Dark.
- **Where:** a three-way toggle (monitor, sun and moon icons) sits next to the language toggle: in the user menu on desktop, in the "More" sheet on phones, and in the top-right corner of the public pages.
- **Remembering it:** a `brs_theme` cookie, so the server renders the right theme on the first paint with no flash. "System" is resolved in the browser through `prefers-color-scheme`.
- **How:** the root element gets `class="dark"` or `class="light"`, and every component reads tokens only. Charts take their colors from the same tokens.

### 1.3 Typography

- **Font:** Geist for text, with `tabular-nums` on every number so columns line up.
- **Big money number** (from today's `DisplayValue`): the integer part is large and the cents are small and raised to the baseline: `R$ 5.800`<sub>`,00`</sub>. It's used on the dashboard cards, the account balances and the totals.
- **Scale:** 12 (labels, uppercase table headers), 14 (body, tables), 16 (inputs), 20 (section titles), 28 (page titles), 40 (card numbers on desktop; 32 on phones).

### 1.4 Shape and spacing

- **Cards:** rounded-xl (12px), a 1px `--border`, no heavy shadow, 20px padding (16px on phones).
- **Controls:** rounded-lg (8px), 36px tall (40px on phones, for touch).
- **Spacing:** a 4px base; 24px between dashboard widgets, 16px inside them.

### 1.5 Patterns

- **Projected values:** `~` prefix, italic, in `--text-muted`. Projected parts of bars are hatched (diagonal stripes in the bar's color).
- **Tabs:** the current colored underline (rose for expenses, emerald for incomes, `--brand` elsewhere). Tabs switch on click, not hover.
- **Tables:** the current style, kept: sticky `--surface-2` header, uppercase 12px column labels, row hover, actions at the row's end. On phones each row becomes a two-line item (description and amount; date, category and badges).
- **Badges:** small rounded pills: `Fixed` (blue), `2/5` installments (muted), `Projected` (dashed border), `Overdue` (amber).
- **Feedback:** toasts at the bottom right (top on phones) for saved, deleted and failed actions, each with "Undo" where the API allows it.
- **Loading:** skeletons shaped like the final content (dashboard.md §4.9). Never a spinner over a whole page.
- **Icons:** lucide, 16px in controls and 20px in navigation.
- **Motion:** 150ms fades and slides for dialogs, sheets and toasts, disabled under `prefers-reduced-motion`.

### 1.6 Logo

- **Mark:** a rounded square tile in `--brand` holding a rising line with an arrow tip, drawn in `--on-brand`. It reads as "money going up", and it works from 16px (favicon) to 64px.
- **Lockup:** the mark followed by the "Be **Rich**" wordmark (Geist semibold, "Rich" in `--income`). The sidebar and the public pages use the lockup. The collapsed sidebar, the phone top bar, the favicon and the app icon use the mark alone.
- **Files:** `public/logo.svg` (mark) and `app/icon.svg` (favicon). An `app/apple-icon.png` (180px) comes with the final brand pass. In the app the mark is a React component (`components/brand/Logo.tsx`), so it follows the theme tokens.

---

## 2. Languages (EN / PT)

- **Two languages:** Portuguese (Brazil) and English. Every visible string comes from a dictionary; there is no hard-coded text in components.
- **Default:** the browser's language (`pt-*` → PT, anything else → EN).
- **Toggle:** an `EN | PT` segmented control in the user menu (desktop), the "More" sheet (phone) and the top-right corner of every public page (login, signup…). Switching takes effect immediately, without a reload.
- **Remembering it:** the choice is stored in a `brs_lang` cookie (1 year), so the server renders the right language on the first paint.
- **Formats stay Brazilian in both languages** (ui-behavior §1.1): `R$ 1.234,56`, `05/12/2026`. Only words change, including month and weekday names (`Dec/2026` ↔ `dez/2026`, `Fri, 05/12` ↔ `sex, 05/12`).
- **Data stays as entered:** category names, descriptions and account names are user data and are not translated. The 25 default categories are created in the signup language. Signup sends the chosen language, and the API keeps a Portuguese and an English name list (auth.md §4.1, schemas §4.1 and §9). After signup they are ordinary user data, and renaming them is up to the household.
- **API errors:** the UI translates by `error.code` and by field-error message keys, falling back to the API's message.
- **Dictionaries:** `messages/en.json` and `messages/pt.json`, with identical keys grouped by page (`login.*`, `dashboard.*`, `entries.*`…). A check in `pnpm lint` fails when a key is missing from either file.

---

## 3. App shell

### 3.1 Desktop (≥ 1024px)

```
┌────────────┬─────────────────────────────────────────────┐
│ Be Rich    │  Page title               [filters] [+ Entry]│
│            ├─────────────────────────────────────────────┤
│ ▣ Dashboard│                                             │
│ ⇅ Entries  │                 page content                │
│ ↻ Fixed    │                                             │
│ ▤ Accounts │                                             │
│ ◇ Categories                                             │
│            │                                             │
│ ⚙ Settings │                                             │
│ (M) Marcelo│                                             │
└────────────┴─────────────────────────────────────────────┘
```

- **Sidebar:** 232px wide on `--surface`; it can collapse to 64px (icons only), and the choice is remembered in the browser.
- **Navigation:** the active item has an `--brand` bar at its left and brighter text.
- **User menu** (bottom): the member's initial and short name. It opens a menu with Profile, the EN/PT toggle, the theme toggle, the household name, and Log out.
- **"+ Entry"** is a split button: the main part opens a new expense; the arrow offers "New income" and "New fixed entry". Keyboard shortcut: `N`.

### 3.2 Tablet (640–1023px)
The sidebar is collapsed to icons by default.

### 3.3 Phone (< 640px)

- **Top bar:** the page title and, on pages with filters, a "Filters" button (dashboard.md §2.2).
- **Bottom tab bar:** Dashboard · Entries · **(+)** · Fixed · More.
  - The central **+** is a raised round `--brand` button. It opens a small sheet: "Expense" / "Income".
  - **More** opens a sheet with Accounts, Categories, Settings, the language and theme toggles, and Log out.
- **Dialogs** become full-height bottom sheets.

---

## 4. Routes

| Route | Page | Spec |
|---|---|---|
| `/login` | Login | §5 |
| `/signup` | Create an account and household | §5, auth.md §4.1 |
| `/forgot-password` | Request a reset link | §5, auth.md §4.6 |
| `/reset-password/[token]` | Choose a new password | §5, auth.md §4.6 |
| `/invite/[token]` | Accept an invitation (sign up into a household) | §5, auth.md §4.7 |
| `/` | Dashboard | dashboard.md |
| `/entries` | Expenses and incomes | §6.2 |
| `/fixed` | Fixed entries | §6.3, ui-behavior §8 |
| `/accounts` | Accounts and cards | §6.4, ui-behavior §4–§5 |
| `/categories` | Categories | §6.5 |
| `/settings` | Household, members, invitations, profile | §6.6, ui-behavior §2–§3 |

- **Route guard:** `proxy.ts` (Next 16's middleware) sends requests without the `brs_session` cookie to `/login?next=<path>`, and sends logged-in users away from the public pages. The cookie's presence is only a hint: a 401 from any API call also returns to `/login`.
- **Not found:** a simple 404 page in the same style, with a link to the dashboard.

---

## 5. Login and the public pages

"Beautifully simple": one centered card on the page background, nothing else.

```
                                              EN | PT
            ┌────────────────────────────────┐
            │            Be Rich             │
            │  Your household's money, clear │
            │                                │
            │  Email                         │
            │  [                           ] │
            │  Password            Forgot?   │
            │  [                         👁] │
            │                                │
            │  [         Log in            ] │
            │                                │
            │  New here? Create an account   │
            └────────────────────────────────┘
```

- **Background:** `--bg` with one soft, blurred `--brand` glow behind the card. That is the only decoration. It works in both themes.
- **Card:** 400px wide (full width on phones, 24px margins), `--surface`.
- **Logo:** the lockup from §1.6, centered above the tagline.
- **Corner:** the language and theme toggles sit side by side in the top-right corner.
- **Fields:** the password has a show/hide toggle. Enter submits. While submitting, the button shows a spinner and the fields lock.
- **Errors:** one line above the button: "Email or password is incorrect" (`INVALID_CREDENTIALS`) or "Too many attempts. Try again in 5 minutes" (`RATE_LIMITED`, from `Retry-After`).
- **After login:** go to `next` if present, otherwise the dashboard.
- **The other public pages** use the same card:
  - **Signup:** name, email, and password with a hint (auth.md §6). The household gets a default name in the signup language (schemas §4.1), which can be renamed in Settings.
  - **Forgot password:** email. It always answers "If this email has an account, we sent a link".
  - **Reset password:** new password twice.
  - **Invite:** shows "Marcelo invited you to join *Coelho household*", then the signup fields with the email fixed. An invalid or expired link shows a clear message and a link to log in.

---

## 6. Pages

### 6.1 Dashboard
Fully specified in [dashboard.md](dashboard.md). The visual rules are:
- the cards use the big number;
- the chart uses `--income` and `--expense` bars with hatched projected parts, and a `--text` balance line that turns `--negative` below zero, with a dashed zero line;
- the category bars use the category's position in a fixed 8-color palette, because categories have no color of their own.

### 6.2 Entries (`/entries`)

- **Tabs:** Expenses | Incomes, with the colored underline and a count. The tab is in the URL (`?tab=incomes`).
- **Filter bar:** period (the same presets as the dashboard), search, and a "Filters" popover (account, card, category, person, method, fixed only). Active filters appear as removable chips.
- **Table:** ui-behavior §10 columns, sorted by payment date. Pagination is "Load more" (api.md §3).
- **Row actions:** edit and delete; series rows ask for the scope (ui-behavior §11).
- **Totals row:** the converted total of the loaded filter (from `/dashboard/summary` with the same filters).
- **Forms:** the expense and income forms are dialogs (bottom sheets on phones), following ui-behavior §6–§7. The live preview (§6.2) shows the installment dates under the form.

### 6.3 Fixed entries (`/fixed`)

- **Top:** the overdue occurrences (the same panel as the dashboard).
- **Below:** the table from ui-behavior §8, with status tabs Active | Paused | Ended | All.
- **Row:** shows the next occurrence and its status badge.
- **Row menu:** Register, Skip, Edit, Change amount, Pause/Resume, End, Delete.
- **Detail:** clicking a row opens a side panel with its occurrences for the next 12 months.

### 6.4 Accounts and cards (`/accounts`)

- **Account cards** in a grid: name, type icon, current balance as a big number, the end-of-month projection, and an "Adjust balance" action (ui-behavior §4.3).
- **Card list** below: alias, last four digits, owner, closing/due days, and the next bill (from `/cards/bills`).
- Archived accounts and cards sit in a collapsed "Archived" section.

### 6.5 Categories (`/categories`)
Two columns, Expenses | Incomes (tabs on phones). Each is a list with rename, archive and a usage count, plus "+ Category".

### 6.6 Settings (`/settings`)
A left sub-navigation (a select on phones) with these sections:
- **Profile:** ui-behavior §2, plus password change.
- **Household:** name and default currency.
- **Members:** list, remove, leave.
- **Invitations:** send, resend, revoke.

---

## 7. Technical architecture

### 7.1 Starting point
The redesign starts fresh inside the existing Next.js 16 / React 19 app.
- **Removed:** the code written for the old API: `context/`, `http/`, `utils/`, `helpers/`, `schema/`, `types/`, `components/*` (except `components/ui`), `app/register` and `app/dashboard`.
- **Kept:** the shadcn setup, `lib/utils.ts`, Tailwind 4, react-hook-form and zod.

### 7.2 Libraries

| Need | Choice | Why |
|---|---|---|
| Server data | **TanStack Query** | Each widget loads, fails and retries on its own; a save invalidates exactly the queries it affects (dashboard.md §4.9). |
| HTTP | A small `fetch` wrapper (`lib/api.ts`) | Adds `X-CSRF-Token` from the `brs_csrf` cookie, sends cookies, parses the error envelope (api.md §2), and redirects to `/login` on 401. Replaces axios. |
| API types | **openapi-typescript**, generated from FastAPI's `/api/v1/openapi.json` | The client's types follow the API exactly; `pnpm gen:api` regenerates them. |
| Languages | **next-intl** (no locale in the URL) | Server and client rendering, plural rules, and the `brs_lang` cookie. |
| Charts | **Recharts** | Composable bars and lines; hatched fills through SVG patterns. |
| UI pieces | **shadcn/ui**: add tabs, popover, dropdown-menu, sheet, tooltip, skeleton, toggle-group, calendar, sonner (toasts) | The same family as today's components. |
| Forms | react-hook-form + zod (as today) | Zod schemas mirror the API's validation, with the messages translated. |
| Money input | `react-currency-input-field` (as today) | Configured for pt-BR separators. |

### 7.3 Structure

```
app/
  (public)/login, signup, forgot-password, reset-password/[token], invite/[token]
  (app)/layout.tsx        ← shell: sidebar / bottom bar
  (app)/page.tsx          ← dashboard
  (app)/entries, fixed, accounts, categories, settings
components/
  ui/                     ← shadcn
  shell/                  ← sidebar, bottom bar, user menu, language toggle
  money/                  ← BigMoney, Money, ProjectedMoney
  dashboard/, entries/, fixed/, accounts/, settings/
lib/
  api.ts, api-types.ts (generated), queries.ts (query keys and hooks),
  format.ts (money, dates, names), period.ts (presets → from/to)
messages/en.json, messages/pt.json
proxy.ts                  ← route guard (Next 16's name for middleware)
```

### 7.4 Conventions
- **Server state** lives only in TanStack Query; there are no global contexts for entries. The URL holds the view state (period, filters, tabs).
- **Money** stays a decimal string from the API to the screen. It's formatted with `Intl.NumberFormat('pt-BR', {style: 'currency'})` and never turned into a float for arithmetic. The UI does no money math; totals come from the API.
- **Dates:** `YYYY-MM-DD` strings, with no time zones. "Today" for display comes from the API's perspective (São Paulo), so the period presets are computed with that zone.
- **Development:** `pnpm dev` with Next `rewrites` sending `/api/*` to `http://localhost:8000` (operations.md §7).

---

## 8. Decisions

1. **Light mode:** included, with System as the default (§1.2).
2. **Logo:** a mark plus the wordmark (§1.6).
3. **Category language:** the defaults are created in the signup language (§2).
4. **Toggle placement:** the language and theme toggles are in the user menu on desktop, the "More" sheet on phones, and the corner of the public pages (§3).
