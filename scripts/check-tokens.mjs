// Fails if lib/tokens.ts and app/globals.css disagree about a color.
//
// Recharts needs literal hex strings and Tailwind v4's @theme needs literal
// values at build time, so the palette genuinely has to exist in both files.
// That duplication is what let the chart palette drift until the health-score
// card rendered a #2d9d78 gauge ring beside a #247d60 badge. This check runs
// as part of `npm run build`, so the two can never ship out of sync again.
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const ts = readFileSync(new URL("lib/tokens.ts", root), "utf8");
const css = readFileSync(new URL("app/globals.css", root), "utf8");

/** Pull `name: "#hex"` pairs out of the TS source. */
function tsColors(src) {
  const out = {};
  for (const [, k, v] of src.matchAll(/^\s{2}(\w+):\s*"(#[0-9a-fA-F]{3,8})"/gm)) {
    out[k] = v.toLowerCase();
  }
  return out;
}

/** Pull `--name: #hex;` pairs out of the :root block. */
function cssVars(src) {
  const root = src.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!root) throw new Error("could not find :root block in globals.css");
  const out = {};
  for (const [, k, v] of root[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8});/g)) {
    out[k] = v.toLowerCase();
  }
  return out;
}

/** Scrape one `export const NAME = { ... }` block by name. */
function tsBlock(src, name) {
  const m = src.match(new RegExp(`${name}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!m) throw new Error(`could not find ${name} in lib/tokens.ts`);
  return tsColors(m[1]);
}

// SEMANTIC and SEMANTIC_VIVID declare the same three keys, so they must be
// read per-block — a flat scrape of the file keeps whichever appears last.
const semantic = tsBlock(ts, "SEMANTIC");
const vivid = tsBlock(ts, "SEMANTIC_VIVID");
const t = { ...tsColors(ts), ...semantic };
for (const [k, v] of Object.entries(vivid)) t[`__vivid_${k}`] = v;
const c = cssVars(css);

// TS constant name → CSS custom property name. Only colors that genuinely
// exist on both sides; chart-only aliases have no CSS counterpart.
const PAIRS = [
  ["success", "success"],
  ["warning", "warning"],
  ["danger", "danger"],
  ["primary", "primary"],
  ["violet", "secondary-from"],
  ["violetLight", "secondary-to"],
  ["indigoDeep", "sidebar-from"],
  ["indigoDeeper", "sidebar-to"],
  ["coral", "accent-warm-to"],
  ["burntOrange", "accent-warm-from"],
  ["foreground", "foreground"],
  ["muted", "muted"],
  ["border", "border"],
  ["card", "card"],
];

for (const k of Object.keys(vivid)) PAIRS.push([`__vivid_${k}`, `${k}-vivid`]);

const problems = [];
for (const [tsKey, cssKey] of PAIRS) {
  const a = t[tsKey];
  const b = c[cssKey];
  if (!a) problems.push(`lib/tokens.ts is missing a value for "${tsKey}"`);
  else if (!b) problems.push(`globals.css is missing --${cssKey}`);
  else if (a !== b)
    problems.push(`--${cssKey}: globals.css has ${b}, lib/tokens.ts has ${a}`);
}

if (problems.length) {
  console.error("\n  ❌ Design tokens are out of sync\n");
  for (const p of problems) console.error(`     ${p}`);
  console.error(
    "\n  Update both files so they agree, then re-run. See the header\n" +
      "  comment in lib/tokens.ts for why the palette lives in two places.\n",
  );
  process.exit(1);
}

console.log(`  ✅ Design tokens in sync (${PAIRS.length} colors checked)`);
