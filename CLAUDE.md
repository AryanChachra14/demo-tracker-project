# CLAUDE.md: 42-Day Fitness Tracker

## What this is

A single-page personal fitness tracker for a fixed plan running 16 Oct – 27 Nov 2026: a daily
checklist (walking, step target, strength workout A/B, breaks, water, sleep), body measurements,
a food log and a quick check-in. It is one static `index.html` with inline CSS and JavaScript:
no build step, no package manager, no server code. Entries are saved in the browser
(`localStorage`) and, once signed in, synced to Supabase.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: markup, one `<style>` block and one inline `<script>` (an IIFE). Loads `@supabase/supabase-js@2.117.2` from jsDelivr. |
| `supabase-setup.sql` | One-time Supabase setup: table `public.tracker_days` (one row per user per day, `entry` as JSONB) with row-level security so each user reads and writes only their own rows. |
| `package.json` | Only defines `npm test`. There are no dependencies. |
| `test/index.test.mjs` | Checks on `index.html` that need no browser (see "Tests and lint"). |
| `README.md` | Just the repo title. |

## How the script works

- **Plan calendar.** `START` = 16 Oct 2026 and `END` = 27 Nov 2026. `phase(d)` maps a date to
  phases 1–5 using hard-coded boundary dates; `workout(d)` gives Strength A or B on Monday,
  Wednesday and Friday, alternating by week; `taskDefs(d)` builds the day's checklist.
- **Element lookup.** `$ = id => document.getElementById(id)`. The script finds every control by
  its id, so an id in the markup and in the script must match exactly.
- **Storage.** `localStorage['fitnessTracker42Day_v1']` holds `{ "YYYY-MM-DD": entry }`, and
  `fitnessTracker42Day_v1_unsynced` lists the days not yet uploaded. Every entry carries `_u`
  (last-edit time in ms); on sync the copy with the newer `_u` wins.
- **Sync.** `initSync()` sets up Supabase email/password sign-in. `pull()` merges the server's
  rows into local storage, then `push()` upserts the unsynced days (debounced 800 ms; retried
  after 30 s on error). `setView()` switches between `checking`, `out` (sign-in form), `in` and
  `local` (no Supabase key configured).
- **Rendering.** `render()` rebuilds the selected day from `load()[selected]`; `save()` copies the
  form fields into `data` and calls `writeDay()`, which stores locally and schedules a push.
- **Config.** `SUPABASE_URL` and `SUPABASE_KEY` sit at the top of the script. The key is a
  publishable (anon) key, public by design; row-level security protects the data. A key starting
  with `PASTE` makes the app run local-only.

## Run it

Nothing to install. Open `index.html` in a browser, or serve the folder and open
http://localhost:8000:

```
python -m http.server 8000
```

Sign-in and sync need internet access, because the Supabase client loads from a CDN.

## Tests and lint

```
npm test
```

This runs Node's built-in test runner (Node 20 or later). There is nothing to install. The tests
in `test/index.test.mjs` check that:

- the page has exactly one inline script, and it compiles;
- every element id the script looks up with a fixed `$('id')` exists in the page.

They don't run the app. After a change, also open the page, use the affected controls and watch
the browser console for errors. There is no linter.

When you add a control the script looks up, give it an id in the markup. When you rename an id,
rename it in both places. Keep the tests dependency-free: Node built-ins only.

## Conventions

- Keep it one static file: no build step, framework or new dependency without asking first.
- The script is deliberately compact (short names, several statements per line). Match that
  style in the lines you touch; don't reformat the rest of the file.
- Day keys are local-time `YYYY-MM-DD` strings built by `key()` and read by `fromKey()`. Don't
  derive them from `toISOString()`, which is UTC and shifts the day.
- Dates shown to the user use the `en-IN` locale.

## Don't change without asking

- `supabase-setup.sql` and its row-level-security policy: they protect every user's data.
- `SUPABASE_URL`, `SUPABASE_KEY`, and the storage key `fitnessTracker42Day_v1` (renaming it
  orphans everything already saved on users' devices).
- The plan content: dates, targets, exercises and the personal details in the guide section.
