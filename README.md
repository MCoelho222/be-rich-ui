# Be Rich

Be Rich helps a household keep track of its money together. It shows **how much you have now** and
**where your money is heading** in the coming months. The app is in English and Portuguese.

This repository is the web app. The server lives in `be-rich-api`.

## The basics

**Your household.** Everyone in a household sees and edits everything. Balances belong to the
household. The **Me / Everyone** switch only filters what each person spent or received.

**Accounts.** Each account starts from an **opening balance** on a date. Anything paid on or before
that date is already inside that number, so it doesn't change the balance again (the entry shows
"Before opening balance"). If the app ever disagrees with your bank, use **Adjust balance**. Accounts
you no longer use can be archived instead of deleted.

**Expenses and incomes.** What moves your balance is the **paid on** date, not the purchase date.
Credit card purchases go on the bill they really belong to (using the card's closing and due days,
and moving to the next business day when needed). Installments are spread across the next bills.

**Fixed entries** (rent, salary, subscriptions…) are templates. They never register themselves:

- In their month they show up as _projected_. Click **Register** when they actually happen. You can
  change the amount or date first.
- If the month ends and you didn't register one, it becomes **overdue**. It stops counting in your
  balance and waits in the overdue list until you register or skip it.
- A credit card fixed expense is due on the card's bill date.

**Investments.** Write down how much you invested, where, and whether you can take it out any day or
only on a set date. You choose if each one counts in your total balance. Views of a single account
leave investments out.

**Transfers.** Use **Transfer** in the **⋯** menu of an account or investment card to move money
between accounts, or between an account and an investment. A transfer is not an expense or an
income, so your total stays the same (unless the investment doesn't count in your balance). An
investment's amount changes right away, so transfers can't be dated in the future. Find them in
**Entries → Transfers**. Deleting one undoes it.

**Dashboard.**

- **Total balance (now)** only counts what is really registered.
- **End of period** also counts fixed entries you haven't registered yet.
- **By account** shows how the total splits between accounts and investments.
- The **projection chart** shows the months ahead and warns you if money would run out.

## For developers

**Stack:** Next.js 16 (App Router), React 19, TanStack Query, Tailwind CSS v4, next-intl, Recharts.
Use **pnpm** and **Node 26 or newer**.

### Run it on your computer

1. Start the API first. In `be-rich-api`, run `docker compose up -d`. This starts Postgres and the API
   on http://localhost:8000, and applies database migrations on start.
2. Here, run `pnpm install` and then `pnpm dev`.
3. Open http://localhost:3000 and sign up.

The browser only ever talks to this app. Next.js forwards every `/api/...` request to `API_ORIGIN`
(by default `http://localhost:8000`). That keeps the login cookies on the same site. **Don't put a
slash at the end of `API_ORIGIN`**, or requests loop.

### Before you open a pull request

```bash
pnpm typecheck
pnpm lint          # also checks that English and Portuguese texts match
pnpm prettier --check <the files you changed>
```

### Good to know

- **Texts:** every word on screen lives in `messages/en.json` and `messages/pt.json`. Add each key
  to both files, or `pnpm lint` fails.
- **API types:** when the API changes, run `pnpm gen:api` (with the local API running) and then
  prettier on `lib/api-types.ts`.
- **Money:** the API sends amounts as text, like `"1250.00"`. Use the helpers in `lib/money.ts` and
  `lib/format.ts` to do math and show them. Never use plain JavaScript numbers for money math.
- **Fresh screens:** after saving something, invalidate the related queries (see the `lib/*.ts`
  hooks) so every screen shows the new numbers.
- **Where things are:**
  - `app/(app)`: pages you see after logging in.
  - `app/(public)`: login, signup and links from emails.
  - `components/<area>`: the pieces of each screen.
  - `lib/`: the API client, data hooks, and money and date helpers.
  - `proxy.ts`: sends logged-out visitors to the login page.
- **Specs come first:**
  - The rules are written down in `specs/` (screens, behavior, dashboard, data) and in
    `be-rich-api/specs` (endpoints, login, operations). When behavior changes, update the spec too.
  - `schemas.md` exists in both repositories: keep the two copies the same.
  - Look and tone follow `DESIGN.md` and `PRODUCT.md`.
- **Git:**
  - Work on a branch from `main` and open a pull request.
  - Never commit `.env` files.
  - Keep real household numbers out of commits, pull requests and issues.

## Deploy

The app runs on Vercel, and every merge to `main` is deployed. In Vercel, set `API_ORIGIN` to the
API's production address (no slash at the end). When an API change needs a database migration, run
it on the production database before releasing the screens that use it.
