---
name: Be Rich
description: Your household's money, clear.
colors:
  night-canvas: "#0b1120"
  night-panel: "#0f172a"
  night-raised: "#1e293b"
  night-hairline: "rgb(255 255 255 / 0.08)"
  night-hairline-strong: "rgb(255 255 255 / 0.12)"
  moonlit-text: "#f1f5f9"
  soft-text: "#cbd5e1"
  muted-text: "#94a3b8"
  faint-text: "#64748b"
  signal-emerald: "#34d399"
  emerald-ink-deep: "#052e1c"
  spent-rose: "#fb7185"
  alarm-rose: "#f43f5e"
  recurring-blue: "#60a5fa"
  caution-amber: "#fbbf24"
  day-canvas: "#f6f7f9"
  day-panel: "#ffffff"
  day-raised: "#f1f5f9"
  day-hairline: "rgb(15 23 42 / 0.08)"
  day-hairline-strong: "rgb(15 23 42 / 0.14)"
  day-text: "#0f172a"
  day-muted-text: "#475569"
  forest-emerald: "#047857"
  forest-emerald-hover: "#065f46"
  meadow-emerald-bar: "#10b981"
  crimson-rose: "#e11d48"
  ink-blue: "#2563eb"
  burnt-amber: "#b45309"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  display-phone:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  input:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  table-header:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
  badge:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-emerald}"
    textColor: "{colors.emerald-ink-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-light:
    backgroundColor: "{colors.forest-emerald}"
    textColor: "{colors.day-panel}"
    rounded: "{rounded.md}"
    height: "36px"
  button-primary-light-hover:
    backgroundColor: "{colors.forest-emerald-hover}"
  input:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.moonlit-text}"
    typography: "{typography.input}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.night-panel}"
    rounded: "{rounded.xl}"
    padding: "20px"
  nav-item:
    textColor: "{colors.muted-text}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "40px"
  nav-item-active:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.moonlit-text}"
  badge-fixed:
    backgroundColor: "rgb(96 165 250 / 0.14)"
    textColor: "{colors.recurring-blue}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  badge-installment:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.muted-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  segmented:
    backgroundColor: "{colors.night-panel}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-active:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.moonlit-text}"
    rounded: "{rounded.sm}"
    height: "28px"
---

# Design System: Be Rich

## Overview

**Creative North Star: "The Night Instrument Panel"**

Be Rich reads like a calm instrument panel at night. The household's money sits on deep slate. Most of the screen stays quiet so that the few colored readings carry the meaning: emerald for money coming in, rose for money going out, blue for what repeats, amber for what needs attention. The big money figure is the main readout. Everything else (labels, borders, chrome) steps back so it can be read at a glance.

It is an instrument, but it lives at home rather than in a bank. Warmth comes from friendly 12px corners, the green brand mark, initials in round avatars, a soft halo behind the public pages, and plain, direct words. Precision comes from tabular figures, hairline borders, an exact type scale and honest projections. Expression is spent on details like these, never on decoration. The light theme is a full equal: the same instrument in daylight, with darker ink shades so the readings keep their contrast.

The system rejects three looks outright: stiff corporate banking UI, gamified fintech (confetti, streaks, mascots, loud gradients), and the default shadcn SaaS dashboard with no identity of its own.

**Key Characteristics:**
- Dark slate first, with an equal light theme. Every color is a token with a value per theme.
- Color is reserved for signals (income, expense, fixed, negative, warning). Chrome stays neutral.
- The big money figure: a large integer, small cents, a muted currency symbol, tabular figures.
- Flat panels separated by hairline borders, not shadows.
- Projected values are always marked: a `~` prefix, italics, muted text, hatched bars.
- Warm details within precise structure: 12px cards, round avatars and badges, a soft emerald halo on auth pages.

## Colors

A deep slate palette with five signal colors. Each signal has one job.

### Primary
- **Signal Emerald** (`signal-emerald` dark / `forest-emerald` light): the brand and the income color at once. Primary buttons, focus rings, the active nav bar, the logo tile, "Rich" in the wordmark, income amounts and tabs. In light mode the bars use the brighter **Meadow Emerald** (`meadow-emerald-bar`) so they read as fills rather than text.
- **Deep Emerald Ink** (`emerald-ink-deep`): text and icons on emerald surfaces in dark mode. Light mode uses white.

### Secondary
- **Spent Rose** (`spent-rose` dark / `crimson-rose` light): expense amounts, the expenses tab, expense bars.
- **Alarm Rose** (`alarm-rose` dark / `crimson-rose` light): negative balances, the "goes negative" marker, destructive actions and invalid fields. It's close to Spent Rose, but its meaning is "below zero", not "spent".

### Tertiary
- **Recurring Blue** (`recurring-blue` dark / `ink-blue` light): the Fixed badge, the fixed share and anything that repeats. It's used on a soft tint (14% dark, 10% light) for badge backgrounds.
- **Caution Amber** (`caution-amber` dark / `burnt-amber` light): the overdue panel, the Overdue badge and the unconverted-currency warning. It's always shown on a faint amber wash (6–8%) with a 30–35% amber hairline.

### Neutral
- **Night Canvas** / **Day Canvas** (`night-canvas` / `day-canvas`): the page background behind everything.
- **Night Panel** / **Day Panel** (`night-panel` / `day-panel`): cards, the sidebar, dialogs, popovers, menus.
- **Night Raised** / **Day Raised** (`night-raised` / `day-raised`): table headers, input fields, hovered rows, the active nav item, the selected segment.
- **Hairline** / **Strong Hairline** (`night-hairline`, `night-hairline-strong`, and their day pairs): card borders and dividers at 8%. Input borders and hover borders at 12–14%.
- **Moonlit Text** / **Day Text** (`moonlit-text` / `day-text`): main text and every number.
- **Soft Text** (`soft-text`): secondary emphasis, cents in the big figure, projected amounts.
- **Muted Text** (`muted-text` / `day-muted-text`): labels, captions, table headers, inactive nav.
- **Faint Text** (`faint-text`): placeholders and disabled text only.

### Category palette
Eight fixed hues (sky `#0ea5e9`, violet `#8b5cf6`, amber `#f59e0b`, pink `#ec4899`, teal `#14b8a6`, orange `#f97316`, indigo `#6366f1`, lime `#84cc16`) used only to tell categories apart in the breakdown. They are identical in both themes and never carry income or expense meaning.

### Named Rules
**The One Meaning Rule.** Each signal color means one thing. Emerald is in or brand, rose is out or below zero, blue repeats, amber needs attention. Never use a signal color as decoration or for an unrelated status.

**The Tokens Only Rule.** Components use token utilities (`text-income`, `bg-surface`, `border-line`), never raw Tailwind palette classes or hex values. The category palette and the SVG chart colors (read through `useThemeColors`) are the only exceptions.

**The Never Color Alone Rule.** Every colored amount also carries a sign, a label or a `~`. Color reinforces the meaning and never carries it alone.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono is loaded but has no role yet.

**Character:** One neutral, engineered sans for everything. Hierarchy comes from size and weight, and from tight tracking on the large sizes, never from a second typeface. Numbers are the main content, so tabular figures (the `.num` utility) are on wherever a number appears.

### Hierarchy
- **Display: the big money figure** (600, 36px desktop / 32px phone, line-height 1, tracking −0.025em): dashboard card totals and account balances. The integer is display size. The cents drop to 16px in Soft Text. The currency symbol is 15px in Muted Text at 80% opacity. A 26px variant (`md`) is used in denser spots.
- **Headline** (600, 28px desktop / 24px phone, tracking −0.025em): page titles in the page header.
- **Title** (600, 16px): widget and section titles. Auth card titles are 18px.
- **Body** (400, 14px, 1.5): table cells, list rows, menus, body copy.
- **Input** (400, 15px): text inside fields, slightly larger than body so it's comfortable to type.
- **Label** (500, 13px, Muted Text): card captions ("Total balance"), field labels, secondary lines.
- **Table header** (500, 12px, uppercase, tracking 0.025em, Muted Text): sticky column labels on Night Raised.
- **Badge** (600, 11px): pills such as Fixed, "2/5" and Projected.

### Named Rules
**The Tabular Figures Rule.** Every number uses tabular figures so columns line up and totals don't jitter as they update. A number without `.num` is a bug.

**The Big Figure Rule.** Only the hero amounts of a view get the big money figure. Everywhere else, amounts are inline at body size. Several big figures competing in one panel is wrong.

## Layout

- **Shell:** on desktop (≥1024px), a 232px sidebar on Night Panel that collapses to 64px, with icons only; the choice is remembered. On tablet (640–1023px) it is collapsed by default. On phones (<640px) the sidebar is replaced by a top bar (the mark and the page title) and a bottom tab bar with a raised round emerald "+" button in the middle (56px, ringed by the canvas color).
- **Page gutter:** 16px on phones, 32px from `sm` up. The page header has 20–28px top padding.
- **Rhythm:** a 4px base. 16px between dashboard widgets on phones and 24px from `sm` up, 16px inside widgets, 12–16px between summary cards.
- **Summary row:** two cards. The balance card leads with the one display-size figure, its end-of-period value, the projection's verdict ("Positive through … · lowest … in …", or the month it goes negative) and an amber line for any account below zero. The flows card groups Income, Expenses and Net at the 26px figure size, with the fixed share as a caption linking to Fixed. Side by side from `xl` (2:3), stacked below; on phones each flow is a row (label left, figure right).
- **Density:** comfortable but not airy. It's a review tool, so tables keep 14px rows. Cards pad 16px on phones and 20px from `sm` up.
- **Auth pages:** one centered column, max 400px, with a soft radial emerald halo (560px, `--glow` at 16% fading to transparent) behind the logo and card.

## Elevation & Depth

The system is flat and tonal. Depth comes from three canvas steps (Canvas → Panel → Raised) and 8% hairline borders, not from shadows. Surfaces at rest never cast a shadow. Shadows are kept for things that float above the page: popovers, dropdown menus, chart tooltips, dialogs, and the floating "+" button on the phone tab bar.

### Shadow Vocabulary
- **Floating layer** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): popovers, dropdown menus, chart tooltips, dialogs.
- **Focus ring** (`box-shadow: 0 0 0 3px var(--ring-color)`): every focusable control. It's emerald at 30–35%, or Alarm Rose's soft tint on an invalid field.
- **Active nav bar** (`box-shadow: inset 3px 0 0 var(--brand)`): the emerald bar on the left of the current nav item.

### Named Rules
**The Flat Panel Rule.** Cards and widgets are flat. To make something stand out, raise its tone (Raised) or strengthen its border (`line-strong` on hover). Never add a shadow to a surface at rest.

## Shapes

The corners are friendly and consistent. Larger containers get rounder corners than the controls inside them, so nested shapes don't clash. Borders are always a single 1px hairline.

- **Cards and widgets:** 12px (`rounded-xl`).
- **Auth card:** 16px (`rounded-2xl`), the softest container, used only on public pages.
- **Controls** (buttons, inputs, nav items, segmented track, alerts): 8px (`rounded-lg`).
- **Inner controls** (the segment inside a segmented track, skeleton blocks): 6px.
- **Pills** (badges, filter chips, avatars, the "+" button, the sheet grabber): fully round.
- **Logo tile:** a rounded square with corners at 28% of its size (9px on a 32px tile).

## Components

### Buttons
Confident and compact. The primary action is the only filled emerald element in a view.
- **Shape:** 8px corners (`rounded.md`), 36px tall on desktop and 40px on phones.
- **Primary:** Signal Emerald fill with Deep Emerald Ink text in dark mode, Forest Emerald fill with white text in light mode. 14px semibold, 14px side padding, and a 16px lucide icon with a 2.4 stroke.
- **Split button** ("+ New expense"): the main part opens a new expense. A 32px chevron segment, separated by a 25% on-brand hairline, offers "New income" and "New fixed entry".
- **Hover / Focus:** the fill shifts to `brand-hover` (lighter emerald in dark mode, deeper in light mode). Focus shows the 3px emerald ring.
- **Ghost / text:** muted text that turns to main text on a Raised background on hover. Inline links are emerald and underline on hover.

### Chips
- **Badges:** small round pills in 11px semibold. Fixed is Recurring Blue on its soft tint. Installment "2/5" is Muted Text on Raised. Projected has a dashed Faint Text border on no fill. Overdue is amber.
- **Filter chips:** 28px round pills on Raised with 13px text and a trailing remove icon. Hover deepens to the hairline tone.
- **Count bubble:** an emerald pill with 11px on-brand figures, for the number of active filters.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Night Panel / Day Panel.
- **Shadow Strategy:** none (The Flat Panel Rule).
- **Border:** 1px hairline. Clickable cards move to the strong hairline on hover.
- **Internal Padding:** 16px on phones, 20px from `sm` up, with 16px between the header and the content.
- **States:** loading shows skeletons in the shape of the final content (pulsing Raised blocks), never a full-page spinner. An error shows an inline Alarm Rose alert with a "Retry" link.

### Inputs / Fields
- **Style:** a Raised fill with a 1px strong hairline, 8px corners, 40px tall, 12px side padding, 15px text and Faint Text placeholders.
- **Focus:** the border turns emerald and the 3px emerald ring appears.
- **Error / Disabled:** an invalid field has an Alarm Rose border with a soft rose ring. A disabled field is at 50% opacity with a not-allowed cursor. A read-only field drops to Muted Text.
- **Money input:** the same shell, with the ring on `focus-within` so the currency prefix and the field read as one control.

### Navigation
- **Sidebar item:** 40px tall, 8px corners, a 20px lucide icon and a 14px medium label. Inactive items are Muted Text and turn to main text on Raised when hovered. The active item is main text on Raised, with the 3px inset emerald bar on its left.
- **User menu:** a 32px round avatar on Raised with the member's initial in emerald, followed by their short name. It opens upward.
- **Tabs:** a colored underline that matches the meaning: rose for expenses, emerald for incomes, brand elsewhere. Tabs switch on click.
- **Phone:** a bottom tab bar (Dashboard, Entries, the raised "+", Fixed, More). Language and theme live in the "More" sheet.

### Segmented control
A 2px-padded track on Panel with a hairline border and 8px corners. Segments are 28px tall (24px small), 12px semibold, with 6px corners. The selected segment is main text on Raised and the others are Muted Text. Used for EN | PT, the System / Light / Dark theme toggle, and small view switches.

### Big money figure (signature)
The readout of the instrument panel. It's described under Typography → Display. A negative value turns Alarm Rose and shows a true minus sign (−). It can take the income or expense tone, but only where that number is income or expenses. Projected amounts never use the big figure in its plain form: they carry `~` and use the muted italic treatment.

### Projection chart (signature)
Monthly bars (income in emerald, expenses in rose) with a balance line, colored from the theme tokens. The projected part of each bar is hatched with 135° stripes, 3px on and 3px off, in the bar's own color (the `.hatch` utility). When the balance would go negative, a rose pill marks it ("goes negative in …"). The tooltip is a floating Panel with 13px text.

## Do's and Don'ts

### Do:
- **Do** use the theme tokens (`bg-surface`, `text-income`, `border-line`) for every color, and give each new token a dark and a light value.
- **Do** put `.num` (tabular figures) on every number, and use a true minus sign (−) for negatives.
- **Do** mark every projected value with `~`, italics and muted text, and hatch the projected part of a bar.
- **Do** keep cards flat: 12px corners, a 1px hairline and 20px padding (16px on phones).
- **Do** keep controls at 8px corners and 36px tall (40px on phones), with the 3px emerald focus ring.
- **Do** show loading as skeletons shaped like the final content, and errors inline with a Retry.
- **Do** keep warmth in the details: round avatars and badges, friendly corners, the emerald mark, plain words.

### Don't:
- **Don't** look like a corporate bank: no stiff navy-and-gray layouts, no heavy chrome, no formal stock imagery.
- **Don't** gamify: no confetti, streaks, mascots, celebratory animation or loud gradients.
- **Don't** ship the default shadcn look. Primitives still on shadcn defaults (`rounded-md`, `h-9`, `shadow-xs`, `bg-transparent` in `button.tsx`, `select.tsx`, `textarea.tsx` and `dialog.tsx`) should be brought in line with the custom components (8px corners, Raised fill, strong hairline, 40px fields).
- **Don't** use a signal color for anything outside its meaning (The One Meaning Rule).
- **Don't** let color carry meaning alone. Every amount also has a sign, a label or a `~`.
- **Don't** put shadows on surfaces at rest. Shadows are only for floating layers.
- **Don't** use raw palette classes (`text-emerald-400`) or hex values in components.
- **Don't** use a spinner over a whole page.
