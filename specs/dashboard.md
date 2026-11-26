# Dashboard

**Status:** agreed. The endpoints it uses are defined in `be-rich-api/specs/api.md` §13.

**Scope:** this file covers the dashboard screen: its layout, each widget, the data each widget needs, and the endpoints that provide it.
- Business rules come from [schemas.md](schemas.md): §13 projections, §14 balances, §15–§16 totals and currency. Section references (§) point there unless stated otherwise.
- General display rules (money formats, projected amounts, currency footnotes) are in [ui-behavior.md](ui-behavior.md) §1.
- Response shapes live only in `api.md` §13, so there's a single source for the contract. §5 below maps each widget to its endpoint.

---

## 1. Purpose

The dashboard is the home screen. It answers, at a glance:

1. **How much do we have right now?** The total balance across accounts.
2. **How is this period going?** What came in, what went out, and what's still expected.
3. **Where is the money going?** The period's expenses (or incomes) by category.
4. **Will we be fine in the coming months?** The projected balance month by month, and when it would go negative.
5. **Is anything waiting on us?** Fixed entries that are overdue, and the next bill of each credit card.

---

## 2. Layout

### 2.1 Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ Period selector · Account filter · Me/Everyone   [+ Entry]  │
├─────────────────────────────────────────────────────────────┤
│ Overdue fixed entries panel  (only when there are any)      │
├────────────────────────┬────────────────────────────────────┤
│ Total balance          │ Income · Expenses · Net             │
│ end of period, outlook │ fixed share                         │
├────────────────────────┴────────────────────────────────────┤
│ Projection chart (monthly bars + balance line)              │
├───────────────────────────────────────┬─────────────────────┤
│ By category  [Expenses | Incomes]     │ Card bills          │
├───────────────────────────────────────┴─────────────────────┤
│ Entry list for the period (actual + projected rows)         │
└─────────────────────────────────────────────────────────────┘
```

- **The summary row has two cards:** the balance card (§4.1) and the flows card (§4.2–§4.3). They sit side by side, 2:3, from 1280px; below that they stack, balance first. Only the balance card uses the big number; the flows use the smaller 26px figure, so the page has one main reading.

### 2.2 Phone

- The filters collapse into one "Filters" button that opens a sheet; the active choices are shown as a short summary ("This month · All accounts · Me").
- The balance card comes first, then the flows card, where each flow is one row: the label on the left, the figure on the right, its caption below.
- The chart takes the full width and shows at most 6 months, scrollable sideways.
- Then, stacked: By category, Card bills, Entry list.
- The overdue panel collapses to a single line, "3 overdue fixed entries", which expands when tapped.

---

## 3. Period selector and filters

### 3.1 Period presets

| Preset | Range |
|---|---|
| **This month** (default) | First to last day of the current month. |
| Next month | First to last day of the following month. |
| Next 3 months | First day of the current month to the last day of the month + 2. |
| Next 6 months | First day of the current month to the last day of the month + 5. |
| This year | Jan 1 to Dec 31 of the current year. |
| Custom | Any `from`–`to` date range, at most 3 years long. |

### 3.2 Filters

- **Account:** "All accounts" (the default) or a single account, archived accounts included at the end of the list. It applies to every widget except the overdue panel (§4.5).
- **Me / Everyone:** "Everyone" (the default) or "Me", the signed-in user. "Me" keeps expenses where I'm the spender and incomes where I'm the receiver, including projected occurrences where I'm the `person_id`.
  - It applies to the income, expenses, net and fixed cards, the chart bars, the category breakdown, the card bills and the entry list.
  - It does **not** apply to balances (the Total balance card and the chart's balance line), because the money in an account belongs to the household. While "Me" is on, those two are labelled "Household balance".
  - It does not apply to the overdue panel (§4.5).

### 3.3 Remembering the view

- The period and filters are kept in the URL: `?period=next-3-months&account=<id>&member=me`, plus `from` and `to` when `period=custom`. Reloading keeps the view, and a shared link opens the same view.
- The last view is also saved in the browser, so opening the dashboard without parameters (from the menu, or a new visit) restores it. If a saved account no longer exists, that filter falls back to "All accounts".
- Defaults, used when nothing is saved: This month, All accounts, Everyone.

---

## 4. Widgets

### 4.1 Total balance

- **Shows:** the current balance as the page's one big number, with a second line "End of period: ~R$ 8.420,00" for the projected balance at the end of the selected period (§14). For a period entirely in the past, the second line is "End of period: R$ 8.420,00" (an actual balance, no `~`).
- **Outlook:** one line from the projection (§4.4) answers "will we be fine?":
  - while the balance stays positive: "Positive through May/2027 · lowest ~R$ 22.876,00 in Nov/2026";
  - when it goes negative: "Goes negative in Mar/2027 · lowest −R$ 1.240,00 in Apr/2027", in `--negative`.
  - "Through" is the last month of the chart range; the lowest point is the lowest end-of-month balance from the current month on. The line is omitted when the projection has no balances (no accounts yet).
- **Accounts below zero:** when any account's current balance is negative, an amber line says so: "Itaú joint is at −R$ 9.359,80 today", or "2 accounts are below zero today" when there are several. The household total can look healthy while one account is overdrawn.
- **With the account filter:** shows that account's balance and outlook.
- **Interaction:** a "By account" button in the card's header opens a per-account breakdown (name, current balance, end-of-period balance) with a link to the Accounts page. Negative current balances show in `--negative`.
- **Empty state:** when no account has an opening balance yet, show the balance as R$ 0,00 with the hint "Set your accounts' opening balances to see real balances".
- **Data:** `GET /balances` twice: `date` = today, and `date` = the period's `to`. The outlook reads the chart's `GET /projection` (same query, fetched once).

### 4.2 Income, Expenses and Net

- **Shows:** the period's totals in the default currency, side by side in one flows card. Net = income − expenses (§13.3).
- **For a period entirely in the past:** the figure is the actual total (§13.2), with no caption.
- **When the period includes today or future dates:**
  - the figure is the **realized** amount (stored rows with a payment date up to today), with the caption "Realized so far · ~R$ 5.400,00 projected", where the projected amount is the total including future rows and projected fixed occurrences (§13). The caption is omitted when the two are equal.
  - when nothing is realized yet (a future period, or the first days of a month), the figure is the **projected total** itself, with the projected treatment (`~`, italic, muted) and the caption "Projected · nothing realized yet". A future month never reads "Income R$ 0,00".
- **Data:** `GET /dashboard/summary`.

### 4.3 Fixed share

- **Shows:** a caption at the bottom of the flows card: "Fixed: 64% of expenses (~R$ 3.443,80)". The share is fixed expenses (registered rows with a recurrence plus projected occurrences) divided by total expenses. The caption is hidden when there are no expenses.
- **Interaction:** clicking it opens the Fixed entries page (ui-behavior §8).
- **Data:** `GET /dashboard/summary`.

### 4.4 Projection chart

- Monthly bars for income and expenses, plus a line for the **cumulative projected balance**, which starts from the current total balance (§14.2).
- **Two axes:** the bars use the left axis and the balance line its own right axis, because balances are usually an order of magnitude larger than a month's flows. Both axes show compact currency ("R$ 22,9 mil").
- The balance is labelled on the line at the first month, the lowest month and the last month.
- Projected parts of each bar are hatched.
- Months where the projected balance is negative are shaded in `--negative`, the line and its dots turn `--negative`, and a dashed zero line appears.
- **Negative warning:** above the chart, "Balance projected to go negative in Mar/2027 · Lowest: −R$ 1.240,00 in Apr/2027", with a "See Mar/2027" button that switches the period to that month (custom range).
- While "Me" is on, the legend labels the line "Household balance" (§3.2).
- Hovering a month shows a breakdown: realized, scheduled future rows (such as installments), projected fixed entries, and the end-of-month balance. The same numbers are available to screen readers as a visually hidden table.
- **Range:** the chart always covers at least the current month and the next 5 months, and stretches to cover the selected period. In months: from = the earlier of the period's first month and the current month; to = the later of the period's last month and the current month + 5. The months inside the selected period are highlighted.
- **Data:** `GET /projection` with that range.

### 4.5 Overdue fixed entries panel

- Listed at the top of the dashboard, shown only when there are any.
- Each row shows the description, the occurrence date with how late it is ("15/10/2026 · 41 days late"), the expected amount, and the actions **Register** and **Skip**.
- **Register** opens the pre-filled form from the Fixed page (ui-behavior §8.3), so the real amount and date can be corrected. **Skip** asks for confirmation. Neither acts in one click.
- A note explains: "Not included in projections until registered."
- **Loading:** nothing is shown while it loads (usually nothing is overdue, so a placeholder would only shift the page). **Error:** a one-line amber message, "Couldn't check for overdue fixed entries", with Retry: a failed check must not pass for "nothing overdue".
- It always covers the whole household and ignores the period and filters: anything overdue needs someone's attention.
- **Data:** `GET /occurrences/overdue` (already implemented).

### 4.6 By category

- A horizontal bar chart of the period's totals per category, largest first.
- Tabs switch between **Expenses** (the default) and **Incomes**, with the colored underline (frontend.md §1.5). The choice is kept with the view (§3.3) as `&categories=incomes`.
- Only categories with entries in the period appear, including projected fixed occurrences; unused categories are never shown.
- Each category's colour comes from its id, so it stays the same whatever its rank in the period. Each bar shows the category's colour (no icon), its name, the amount and its share of the total. The projected part of a bar is hatched, as in the chart.
- At most 8 bars are shown; when there are more, a "Show all (12)" link expands the list.
- **Interaction:** clicking a bar opens the Expenses (or Incomes) list filtered by that category and the period.
- **Empty state:** "No expenses in this period" (or incomes).
- **Data:** `GET /dashboard/categories`.

### 4.7 Card bills

- One row per active credit card (`CREDIT` or `CREDIT_DEBIT`), showing the card's name and owner, the **next bill's** due date, its closing date ("closes Dec 2"), and its total.
- The next bill is the first statement whose due date is today or later. It doesn't depend on the period selector, because the question is always "what's coming".
- The total includes stored credit rows due on that date plus projected occurrences of credit recurrences on that card; when part of it is projected, it shows as "~R$ 1.240,00".
- A card with nothing on its next bill shows R$ 0,00.
- **Interaction:** clicking a row opens the Expenses list filtered by that card and that due date.
- **Empty state:** the widget is hidden when the household has no credit cards.
- **Data:** `GET /cards/bills`.

### 4.8 Entry list

- Shows the period's rows: stored expenses and incomes, plus projected occurrences, newest payment date first.
- Projected occurrences appear as muted rows with a single "Projected" badge (with the repeat icon, since they are always fixed entries) and a **Register** action that opens the pre-filled form (§4.5). They can't be edited directly.
- Rows follow the badges and formats in ui-behavior §10.
- "All / Expenses / Incomes" tabs filter the list, with the same colored underline as §4.6.
- **Pagination:** the first 50 rows, then "Load more".
- **Data:** `GET /projection/items`.

### 4.9 States shared by every widget

- **Loading:** skeleton placeholders the size of the final widget, so the layout doesn't jump.
- **Error:** an inline message with a "Retry" button inside the widget. Other widgets keep working.
- **New household with no entries:** the summary shows R$ 0,00 and the chart area shows "Add your first expense or income to see the projection" with "New expense" and "New income" buttons.
- **Currency:** the footnote and the unconverted warning from ui-behavior §1.7.
- **After a change:** creating, editing, registering or skipping an entry from the dashboard refreshes every widget.

---

## 5. Data contract

Each widget loads independently, so a slow widget doesn't hold up the others. The response shapes are in `be-rich-api/specs/api.md` §13.

The dashboard's filters map to the same query parameters on every endpoint: `from`, `to`, `account_id` and `member_id` ("Me" sends the signed-in user's ID; "Everyone" sends nothing).

| Widget | Endpoint | api.md | Rules |
|---|---|---|---|
| Total balance (§4.1) | `GET /balances?date=&account_id=`, for today and for `to`; the outlook reuses the chart's `GET /projection` | §13.2, §13.4 | §14 |
| Income, Expenses, Net, Fixed (§4.2–§4.3) | `GET /dashboard/summary` | §13.3 | §13, §15 |
| Projection chart (§4.4) | `GET /projection` (chart range, not the period) | §13.4 | §13–§14 |
| Overdue panel (§4.5) | `GET /occurrences/overdue` | §12.3 | §12.1 |
| By category (§4.6) | `GET /dashboard/categories?type=` | §13.5 | §13, §15 |
| Card bills (§4.7) | `GET /cards/bills` (no `from`/`to`) | §13.6 | §10.3, §17 |
| Entry list (§4.8) | `GET /projection/items?type=&limit=&cursor=` | §13.7 | §13.1 |

Every response that contains converted totals also includes `currency`, `rates_as_of` and `unconverted` (§15, §16.4).
