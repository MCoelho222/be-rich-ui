# UI Behavior

**Scope:** this file covers how forms and views present, format and collect data.
Data types, validation limits and business rules are defined in [schemas.md](schemas.md), and section references (§) point to that file. The UI mirrors those rules to give fast feedback, but the server is always the authority.

---

## 1. Global conventions

### 1.1 Display formats

| Value | Display format | Example |
|---|---|---|
| Money | Formatted for the entry's currency, using pt-BR separators | `R$ 1.234,56` · `US$ 1.234,56` |
| Negative balance | A minus sign, shown in the "negative" color | `−R$ 320,00` |
| Converted money | The value in the default currency, with the original value shown smaller beside it | `R$ 545,10` *(US$ 100,00)* |
| Projected amount | Prefixed with `~` and shown in italic or muted text | *~R$ 1.800,00* |
| Date | `DD/MM/YYYY` | `05/12/2026` |
| Date with weekday (lists) | `ddd, DD/MM` | `sex, 05/12` |
| Month | `MMM/YYYY` | `Dec/2026` |
| Installment | `n/N` | `2/5` |
| Person (short) | First name + initial of the last name + `.`. A one-word name is shown as is. | `Marcelo C.` |
| Former member | The short name followed by a muted "(former member)" | `Ana S. (former member)` |

### 1.2 Masked inputs

- The user types **digits only**. The mask adds punctuation as they type.
- **Pasting** accepts formatted or unformatted values (`123.456.789-09` or `12345678909`).
- The form submits the **normalized** value (digits only, or E.164) and never the masked string.

### 1.3 Validation feedback

- A field is validated when it loses focus (on blur) and again when the form is submitted.
- The error message appears below the field, and the first invalid field gets focus when submit fails.
- The submit button is disabled while a request is in progress, which prevents duplicate records.
- Errors returned by the server are mapped onto the matching fields. Errors that don't belong to a field are shown at the top of the form.

### 1.4 Required fields

Required fields are marked with `*`. Optional fields have no marker.

### 1.5 Pickers that allow creating items ("create on the fly")

The Category, Account and Card pickers work as searchable comboboxes:

- Typing filters the existing **active** options.
- When nothing matches, the picker shows a **"+ Create '…'"** option:
  - For a Category, it creates the item inline.
  - For an Account, it opens a short dialog with the name, plus the opening balance and date, both optional (schemas §7).
  - For a Card, it opens the Card form in a nested dialog.
- The new item is then selected automatically.
- Archived items are hidden from pickers. They still appear, with an "archived" badge, on existing records that reference them.
- Person pickers (spender, receiver, owner) list **current members only**. A row that references a former member shows that person as read-only text (§1.1) until it is changed.

### 1.6 Character counters

Text fields with a maximum length show a counter (`42/200`) once 80% of the limit is used.

### 1.7 Currency disclosure

- Every view that shows converted totals has a footnote: "Converted to BRL · rates as of 19/11/2026". The date comes from `rates_as_of` (schemas §15).
- If the response contains `unconverted` amounts (schemas §16.4), a warning banner is shown: "Some amounts in USD could not be converted and are not included in the totals."

---

## 2. User form

| Field | Behavior |
|---|---|
| Name | Plain text input. |
| Email | Email input. Duplicates are rejected by the server with "Email already registered". **Locked** (read-only) when the user is signing up from an invitation. |
| CPF | Mask `000.000.000-00`, accepting up to 11 digits. Check digits are validated on blur, with the error "Invalid CPF". Example: typing `12345678909` shows `123.456.789-09`. |
| Birth date | Masked input `DD/MM/YYYY` with that placeholder, plus a date-picker button. Future dates are rejected. |
| Phone | A country selector (country code + dialing code, e.g. `BR +55`, default **Brazil**; flag emoji are avoided because Windows shows them as letters) next to the number input. The number is formatted as the user types, following the selected country's pattern (BR mobile: `(48) 99999-9999`). Submitted in E.164 format. |
| CEP | Mask `00000-000`. Example: `88303575` shows `88303-575`. *Optional enhancement:* once 8 digits are entered, look up the CEP and fill in street, neighborhood, city and state, leaving all fields editable. |
| Address | Separate inputs: street, number (with an "S/N" checkbox), complement, neighborhood, city, state (a select with the 27 UFs). |
| Notes | Textarea with a character counter (500). Placeholder: "Anything you want to remember". |

---

## 3. Household settings

### 3.1 General

| Field | Behavior |
|---|---|
| Household name | Text input. |
| Default currency | A select of the supported currencies. Changing it shows a confirmation: "All totals, balances and projections will be shown in USD. Existing entries keep their original currency." |

### 3.2 Members

- The page lists the members, showing each one's short name and email. The logged-in user is marked "(you)".
- **Remove** (available on other members):
  - The confirmation dialog reads: "Remove Ana S. from the household? Their entries, cards and fixed entries stay here. Cards they own will be archived. They will keep their account in a separate, empty household."
- **Leave household** (available on yourself):
  - The confirmation dialog reads: "Leave this household? You'll lose access to all its data and start with an empty household. This can't be undone in this version."
  - After confirming, the user is signed into their new, empty household.
- Both actions are **hidden** when the household has only one member (schemas §4.2 rule 2).

### 3.3 Invitations

- The page lists **pending invitations**, showing the email, who sent it, and the expiry date.
- **Invite member:**
  1. A dialog asks for an email address.
  2. On success, it shows a toast: "Invitation sent to ana@example.com".
  3. If the address already has an account, it shows the inline error "This email already has an account" (schemas §6.1 rule 6).
- Each pending invitation has **Resend** and **Revoke** actions. Revoking asks for confirmation.
- **Invitation link** (`/invite/<token>`):
  - **Valid:** opens the signup form with the email pre-filled and locked, and a header reading "Join Marcelo's household".
  - **Expired, revoked or already used:** shows the message "This invitation is no longer valid. Ask a household member to send a new one."

---

## 4. Accounts

### 4.1 Accounts page

- Each account is shown as a card with its name, type icon (bank or cash), **current balance**, and **projected balance at the end of the month**.
- The header shows **Total balance**, the sum of all accounts in the default currency (schemas §14.2).
- Archived accounts are grouped in a collapsed "Archived" section, and their balances still count in the total.

### 4.2 Account form

| Field | Behavior |
|---|---|
| Type | A segmented control with Bank and Cash. Default: Bank. It can't be changed after creation. |
| Name | Text input. Helper text: "e.g. Nubank, Itaú, Wallet". |
| Currency | A select. Defaults to the household's default currency. |
| Opening balance | A currency input that accepts negative values (a −/+ toggle). Default `0,00`. |
| Balance on | Date picker, default today. Helper text: "Entries paid on or before this date are considered part of the opening balance." |

### 4.3 Adjust balance

- Each account has an **Adjust balance** action. The dialog asks: "What is the real balance of this account today?" The date field defaults to today and can be edited.
- Before saving, it shows the difference: "The app shows R$ 1.250,00. Adjusting to R$ 1.180,00 (−R$ 70,00)."
- Saving updates the opening balance and its date (schemas §14.3).

---

## 5. Card form

| Field | Behavior |
|---|---|
| Owner | A select listing current members by their short name (§1.1). Defaults to the logged-in user. |
| Alias | Single word. Spaces are blocked as the user types and removed from pasted text. Helper text: "One word, e.g. Nubank, Porto". |
| Type | A segmented control with Credit, Debit and Credit + Debit. Default: Credit. |
| Paying account `*` | An Account picker (Bank accounts only) that allows creating items. Helper text: "The account that pays the statement or is charged on debit." |
| Last 4 digits | Numeric input, exactly 4 digits. Optional. |
| Best buy day / Due day | Selects from 1 to 31, shown only when the type includes credit. Helper text: "Purchases on or after the best buy day go to the next statement. Due dates on weekends or holidays move to the next business day." |
| Live preview | Shown once both days are set: "A purchase made today would be due on **07/12/2026**", computed with schemas §10.3, including the business-day adjustment. |

---

## 6. Expense form

### 6.1 Layout and fields

| Field | Behavior |
|---|---|
| Amount `*` | Currency input showing the currency symbol and pt-BR separators. This is the **total** purchase amount. |
| Currency | A compact select next to Amount. Defaults to the household's **default currency**. |
| Date `*` | Date picker, default today. Labeled "Purchase date". |
| Payment method `*` | Toggle chips: Cash · Pix · Credit · Debit · Boleto · Transfer. Exactly one is selected by default, and "Split payment" (§6.3) allows more than one. |
| Card | Shown only for Credit or Debit, and required in that case. Lists only active cards whose type supports the selected method. Allows creating a card (§1.5). The paying account is shown below as read-only text: "Paid from Nubank". |
| Account | **For Pix, Boleto and Transfer:** required, as an Account picker (Bank accounts only) that allows creating items. **For Cash:** hidden, and the household's Cash account is used automatically. If the household has more than one cash account, a picker is shown instead. **For Credit and Debit:** hidden, because the card's account is used. |
| Installments | A number input from 1 to 60, default 1. **Hidden for Debit**, and hidden when "Repeats" is on. |
| Category `*` | A Category picker (EXPENSE type) that allows creating items. |
| Spender | A select of current members, defaulting to the logged-in user. |
| Description | Single-line input with a counter (200). |
| Repeats (fixed expense) | A toggle labeled "This is a fixed expense", default off. See §6.4. |

### 6.2 Calculated preview (read-only)

The form shows a summary below the fields that updates as the user types:

- **Installments:** `3 × R$ 33,33` (with a note `1st: R$ 33,34` when cents are left over, following schemas §10.1).
- **Payment date:** "Charged on **07/12/2026**" for Credit, calculated with the card's cycle and the business-day adjustment (§10.3). For other methods it is not shown, because it equals the purchase date.
- **Series range** when there are installments: "Dec/2026 → Feb/2027".
- **Conversion** when the currency is not the default: "≈ R$ 545,10 at today's rate".

### 6.3 Split payment

- The "Split payment" link switches the form to a **list of payment lines**. Each line has its own method, card or account (when needed), amount and installments.
- "+ Add payment method" adds a line, and each line can be removed (the minimum is 2 lines while split mode is on).
- A running indicator shows `Remaining: R$ 12,50` and turns red when the lines don't add up to the total. Submit stays disabled until the remaining amount is `R$ 0,00`.
- Date, category, spender and description are shared by every line.
- Split payment is not available while "Repeats" is on.

### 6.4 Fixed expenses (Repeats)

- Turning the toggle on reveals the following fields:
  - **Every:** `1` month (a select: monthly, every 2, 3 or 6 months, yearly).
  - **On day:** defaults to the purchase date's day.
  - **Until:** optional end date. "No end date" is selected by default.
- **Credit card:** the fixed expense runs on the card's bills (schemas §12.1).
  - **On day** shows the card's due day and can't be changed.
  - The date field becomes **"First bill"**. Its hint gives the due date of that month's bill: "Due on 16/12/2026. If that date has passed, this payment is registered now; otherwise it's the next one."
  - The preview shows the bill's payment date (business-day adjusted).
- Saving creates a **Recurrence** (schemas §12), in a single action with registering the first occurrence when its date has passed:
  - **Date today or earlier:** the first occurrence is registered as an Expense row. The success toast reads: "Fixed expense created. It will appear in your projections every month."
  - **Date in the future:** nothing is registered. The date is the first occurrence still to come, and it shows as the next one on the Fixed page. The toast reads: "Fixed entry created. The first one is on 16/12/2026."

---

## 7. Income form

Same layout as the Expense form, with these differences:

| Field | Behavior |
|---|---|
| Receiver | Replaces Spender. Defaults to the logged-in user. |
| Account | Replaces Card. **For Cash:** handled automatically, as in the Expense form. **For every other method:** required, as an Account picker (Bank accounts only) that allows creating items. Labeled "Received in". |
| Installments | Available for every method. |
| Category `*` | An INCOME-type Category picker that allows creating items. The list starts empty, so on the first income the picker opens showing the create option. |
| Payment date preview | For Credit: "Expected on **21/12/2026**" (same day next month, moved to the next business day, schemas §11.1). |
| Repeats (fixed income) | Same behavior as §6.4, for example for a salary. |

---

## 8. Fixed entries page

This page lists every Recurrence, in two tabs: **Expenses** and **Incomes**.

### 8.1 Columns

| Column | Content |
|---|---|
| Description / category | |
| Amount | The expected amount, converted to the default currency if needed (§1.1). |
| Frequency | "Monthly on day 5" or "Yearly on 10/03". |
| Account / card | |
| Next occurrence | The next date, and its status. |
| Validity | "Since Jan/2026 · no end" or "Jan/2026 → Jun/2027". |
| Status | Active, Paused or Ended. |

### 8.2 Filters and totals

- Filters: Active (the default), Paused, Ended, All.
- A header shows "Fixed expenses: ~R$ 4.200,00 / month" and "Fixed incomes: ~R$ 9.000,00 / month", counting the active recurrences valid in the current month, each divided by its interval (a yearly one counts 1/12). After a "Change amount", only the version valid this month counts. Amounts in other currencies are noted, not converted.

### 8.3 Row actions

| Action | Effect |
|---|---|
| **Register** | Opens the Expense or Income form pre-filled for the next pending or overdue occurrence (schemas §12.2). For a credit card fixed expense the date field is "Purchase date", pre-filled with a date inside that bill (schemas §12.1). |
| **Skip this month** | Adds the occurrence to `skipped_dates`, after a confirmation. |
| **Edit** | Opens the Recurrence form. A notice reads "Changes apply to future occurrences only." |
| **Change amount from…** | Asks for the date the new amount starts and the new amount. It ends the current Recurrence the day before that date and creates a copy with the new amount (schemas §12.3). |
| **Pause / Resume** | Toggles `is_active`. |
| **End** | Sets `end_date` (defaults to today). The status becomes **Ended** once nothing is left to come (api.md §12.2). An error from the server shows under the date. |

### 8.4 Pending and overdue occurrences

- Pending occurrences in the current month show a "Due on 05/12" badge.
- Overdue occurrences show a red "Overdue" badge, with the actions Register and Skip. They **stay overdue until someone acts**, and nothing is registered automatically (schemas §12.1).
- A Recurrence whose person is a former member, or whose card, account or category is archived, shows a warning icon. Register asks for a valid replacement first (schemas §4.2 rule 6 and §18).

---

## 9. Dashboard and projections

The dashboard has its own spec: [dashboard.md](dashboard.md). It covers the period selector and filters, summary cards, projection chart, category breakdown, card bills, overdue panel and entry list.

---

## 10. Lists and tables

- Rows in an installment series show an `n/N` badge. Rows in a split payment show a "split" icon. Hovering the icon lists the sibling parts.
- Rows registered from a Recurrence show a "fixed" icon. They can be filtered with a "Fixed only" toggle, and clicking the icon opens the Recurrence.
- An Account column and an Account filter are available.
- Amounts in a non-default currency use the converted format (§1.1).
- Archived cards, accounts and categories still appear on existing rows, marked with an "archived" badge. Former members are labeled as described in §1.1.

---

## 11. Editing and deleting

### 11.1 Rows that belong to an installment series

When the user edits or deletes a row that belongs to an installment series, a dialog asks for the scope before going further:

> **This expense is installment 2 of 5.**
> ○ Only this installment
> ○ This and following installments
> ○ All installments

- Fields that can only change with scope "All" (schemas §10.6) are **disabled** for the other scopes, with the tooltip: "Changing this affects the whole series. Choose 'All installments'."
- With scope "All", the Amount field shows and edits the **series total**.

### 11.2 Rows registered from a Recurrence

- Editing such a row changes only that row, and the Recurrence is not modified. The form shows a link: "Edit the fixed expense instead".
- Deleting such a row shows the confirmation: "Delete this payment? The fixed expense stays active and this occurrence will show as pending or overdue again."

### 11.3 Delete confirmation

Every delete asks for confirmation and states what will be removed, for example "Delete 3 installments totaling R$ 100,00?". This dialog is skipped when the scope dialog already made the impact clear.

### 11.4 Cards, accounts, categories and recurrences that are in use

When the user tries to delete one of these that existing records use, the UI offers an alternative instead:

- For a card, account or category, it offers **Archive**, with the message: "This card is used by 14 expenses. Archive it to hide it from new entries."
- For the last active Cash account, Archive is disabled (schemas §18).
- For a Recurrence that has registered payments, the delete dialog asks what happens to them: **"Keep them as regular entries"** (the default) or **"Delete the N payments too"**. Balances, totals and projections follow either way. It also offers **End instead**.
