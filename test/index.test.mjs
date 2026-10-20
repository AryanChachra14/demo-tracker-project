// Checks for index.html that need no browser and no dependencies.
// Run with: npm test   (Node's built-in test runner)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

// Inline <script> blocks are the ones without a src attribute.
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const inlineScripts = [...html.matchAll(INLINE_SCRIPT)].map((m) => m[1]);
const script = inlineScripts.join("\n");
const markup = html.replace(INLINE_SCRIPT, "");

test("the page has exactly one inline script", () => {
  assert.equal(inlineScripts.length, 1);
});

test("the inline script compiles", () => {
  assert.doesNotThrow(() => new vm.Script(script, { filename: "index.html <script>" }));
});

test("every element id the script looks up exists in the page", () => {
  const pageIds = new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  // Fixed lookups only: $('id'), $("id") and $(`id`) without ${...}. Ids built at run time
  // (nap rows, checklist items) are created by the script itself, so they are skipped.
  const lookups = new Set(
    [...script.matchAll(/\$\(\s*(["'`])([^"'`$]+)\1\s*\)/g)].map((m) => m[2]),
  );
  assert.ok(lookups.size > 0, "found no $('id') lookups; has the lookup helper changed?");
  const missing = [...lookups].filter((id) => !pageIds.has(id));
  assert.deepEqual(missing, [], `ids looked up by the script but missing from the page: ${missing.join(", ")}`);
});

test("the day counter's total matches the plan length in the title", () => {
  const title = html.match(/<title>(\d+)-Day\b/);
  assert.ok(title, "found no 'N-Day' in the page title");
  // Totals in labels like `Day ${...} of 42`.
  const totals = [...script.matchAll(/Day \$\{[^}]*\} of (\d+)/g)].map((m) => m[1]);
  assert.ok(totals.length > 0, "found no 'Day ${...} of N' label in the script");
  assert.deepEqual([...new Set(totals)], [title[1]]);
});
