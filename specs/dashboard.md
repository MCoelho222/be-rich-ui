# Dashboard

**Status:** draft, being designed. Content marked *(proposed)* has not been agreed yet.

**Scope:** this file covers the dashboard screen: its layout, each widget, the data each widget needs, and the endpoints that provide it.
- Business rules come from [schemas.md](schemas.md): §13 projections, §14 balances, §15–§16 totals and currency. Section references (§) point there unless stated otherwise.
- General display rules (money formats, projected amounts, currency footnotes) are in [ui-behavior.md](ui-behavior.md) §1.
- Once agreed, the data contract in §5 becomes `be-rich-api/specs/api.md` §13.

---

## 1. Purpose

The dashboard is the home screen. It answers, at a glance:

1. **How much do we have right now?** The total balance across accounts.
2. **How is this period going?** What came in, what went out, and what's still expected.
3. **Will we be fine in the coming months?** The projected balance month by month, and when it would go negative.
4. **Is anything waiting on us?** Fixed entries that are due or overdue.

---

## 2. Layout *(proposed)*

### 2.1 Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ Period selector · Account filter                 [+ Entry]  │
├─────────────────────────────────────────────────────────────┤
│ Overdue fixed entries panel  (only when there are any)      │
├───────────┬───────────┬───────────┬───────────┬─────────────┤
│ Total bal.│ Income    │ Expenses  │ Net       │ Fixed       │
├───────────┴───────────┴───────────┴───────────┴─────────────┤
│ Projection chart (monthly bars + balance line)              │
├─────────────────────────────────────────────────────────────┤
│ Entry list for the period (actual + projected rows)         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Phone

- The summary cards are a horizontally scrollable row, with Total balance first.
- The chart takes the full width and shows at most 6 months.
- The entry list stacks below the chart.
- The overdue panel collapses to a single line, "3 overdue fixed entries", which expands when tapped.

---

## 3. Period selector and filters

- **Presets:** **This month** (the default), Next month, Next 3 months, Next 6 months, This year, and Custom (a date range).
- **Account filter** *(proposed)*: "All accounts" (the default) or a single account. It applies to every widget: balances, cards, chart and list.
- **Remembering the choice** *(proposed)*: the period and the account are kept in the URL (for example `?period=next-3-months&account=…`). Reloading keeps the view, and a link opens the same view.

---

## 4. Widgets

### 4.1 Total balance

- **Shows:** the current balance, with a second line "End of period: ~R$ 8.420,00" for the projected balance at the end of the selected period (§14).
- **With the account filter:** shows that account's balance.
- **Interaction** *(proposed)*: clicking it shows a per-account breakdown (name, current balance, projected balance) and links to the Accounts page.
- **Empty state:** when no account has an opening balance yet, show the balance as R$ 0,00 with the hint "Set your accounts' opening balances to see real balances".

### 4.2 Income, Expenses and Net cards

- **Shows:** totals for the period in the default currency. Net = income − expenses (§13.3).
- **When the period includes today or future dates**, each card has two lines:
  - "**Realized** R$ 3.100,00": stored rows with a payment date up to today;
  - "**Projected** ~R$ 5.400,00": the total, including future rows and projected fixed occurrences (§13).
- **For a period entirely in the past**, there is a single line: the actual total (§13.2).

### 4.3 Fixed card

- **Shows:** the fixed share of the period's expenses: fixed expenses (registered rows with a recurrence plus projected occurrences) divided by total expenses, as an amount and a percentage.
- **Interaction:** clicking it opens the Fixed entries page (ui-behavior §8).

### 4.4 Projection chart

- Monthly bars for income and expenses, plus a line for the **cumulative projected balance**, which starts from the current total balance (§14.2).
- Projected parts of each bar are hatched or lighter.
- Months where the projected balance goes negative are highlighted, with the message "Balance projected to go negative in Mar/2027".
- Hovering a month shows a breakdown: realized, future installments, projected fixed entries, and the end-of-month balance.
- **Range** *(proposed)*: the chart always shows at least the current month and the next 5 months, even when the period selector is shorter, so the "will we be fine?" question is always answered.

### 4.5 Overdue fixed entries panel

- Listed at the top of the dashboard, shown only when there are any.
- Each row shows the description, the occurrence date, the expected amount, and the actions **Register** and **Skip**.
- A note explains: "Not included in projections until registered."

### 4.6 Entry list

- Shows the period's rows: stored expenses and incomes, plus projected occurrences.
- Projected occurrences appear as muted rows with a "projected" badge and a **Register** action. They can't be edited directly.
- Rows follow the badges and formats in ui-behavior §10.
- **Pagination** *(proposed)*: the first 50 rows, then "Load more".

### 4.7 States shared by every widget

- **Loading:** skeleton placeholders the size of the final widget, so the layout doesn't jump.
- **Error:** an inline message with a "Retry" button inside the widget. Other widgets keep working.
- **New household with no entries:** the cards show R$ 0,00 and the chart area shows "Add your first expense or income" with the "+ Entry" button.
- **Currency:** the footnote and the unconverted warning from ui-behavior §1.7.

---

## 5. Data contract *(proposed)*

Each widget loads independently, so a slow widget doesn't hold up the others.

| Widget | Endpoint | Rules |
|---|---|---|
| Total balance (§4.1) | `GET /balances?date=` for today and for the end of the period | §14 |
| Income, Expenses, Net, Fixed (§4.2–§4.3) | `GET /dashboard/summary?from=&to=&account_id=` | §13, §15 |
| Projection chart (§4.4) | `GET /projection?from=&to=&account_id=` (monthly) | §13–§14 |
| Overdue panel (§4.5) | `GET /occurrences/overdue` (already implemented) | §12.1 |
| Entry list (§4.6) | `GET /projection/items?from=&to=&account_id=&limit=&cursor=` | §13.1 |

Every response that contains converted totals also includes `currency`, `rates_as_of` and `unconverted` (§15, §16.4).

The exact response shapes will be written here once the widgets are agreed, then copied to `api.md` §13.

---

## 6. Open questions

1. **Spending by category:** should the dashboard show a breakdown of the period's expenses by category, for example a bar list of the top categories?
2. **Card bills:** should it show the upcoming statement total per credit card (the sum of credit rows due on each card's next due date)?
3. **Per-member view:** should there be a "Me / Everyone" toggle that filters by spender and receiver?
4. **Chart range:** confirm the proposal in §4.4 (at least the current month plus 5).
5. **Remembering the view:** URL parameters (§3), or should the dashboard always open on "This month, all accounts"?
