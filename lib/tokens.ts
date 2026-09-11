/**
 * The single source of truth for Budgety's palette.
 *
 * Two consumers need these colors in two different forms:
 *   - CSS/Tailwind wants custom properties  → app/globals.css
 *   - Recharts and raw SVG want literal hex → they import from here
 *
 * Tailwind v4's `@theme` needs literal values at build time, so globals.css
 * can't read this file. Instead `scripts/check-tokens.mjs` diffs the two and
 * fails the build if they disagree — which is what previously let the chart
 * palette drift from the CSS palette until the health-score card was rendering
 * two different greens two pixels apart.
 *
 * If you change a value here, change it in globals.css too. The check will
 * tell you if you forget.
 */

/** Text-weight semantic colors. Chosen to pass WCAG AA on white/`--card`. */
export const SEMANTIC = {
  success: "#247d60",
  warning: "#b45309",
  danger: "#cb3939",
} as const;

/**
 * Fill-weight semantic colors — chart bars, gauge rings, progress fills.
 *
 * These are deliberately lighter than SEMANTIC: large blocks of color need
 * less contrast than text does, and the AA-compliant text colors read as muddy
 * when used as fills. Each is the same hue as its SEMANTIC counterpart, so a
 * gauge and the badge beside it are recognisably the same color. Never use a
 * `-vivid` value for text.
 */
export const SEMANTIC_VIVID = {
  success: "#2f9e78",
  warning: "#d97706",
  danger: "#e05050",
} as const;

export const BRAND = {
  primary: "#4d44b5",
  violet: "#6c63ff",
  violetLight: "#8f88ff",
  indigoDeep: "#2d2a6e",
  indigoDeeper: "#1a1751",
  coral: "#f0997b",
  burntOrange: "#d85a30",
} as const;

export const NEUTRAL = {
  foreground: "#1b1b3a",
  muted: "#6b6b8a",
  border: "#e9e9f4",
  card: "#ffffff",
} as const;

// --- Chart-facing aliases -------------------------------------------------
// Recharts props take strings, not CSS vars. These are the only names chart
// code should reference.

export const CHART_PRIMARY = BRAND.primary;
export const CHART_SUCCESS = SEMANTIC_VIVID.success;
export const CHART_WARNING = SEMANTIC_VIVID.warning;
export const CHART_DANGER = SEMANTIC_VIVID.danger;
export const CHART_GRID = NEUTRAL.border;
export const CHART_AXIS = NEUTRAL.muted;
export const CHART_FOREGROUND = NEUTRAL.foreground;
export const CHART_MUTED = NEUTRAL.muted;

/**
 * Categorical series colors, in application order. Capped at 6 because the
 * dashboard donut groups everything beyond the top 5 into "Other" — pie charts
 * stop being readable past about five slices.
 */
export const CHART_CATEGORICAL = [
  BRAND.primary,
  BRAND.violet,
  SEMANTIC_VIVID.warning,
  BRAND.burntOrange,
  SEMANTIC_VIVID.success,
  NEUTRAL.muted,
] as const;

/** Slices beyond the top N on a donut collapse into this. */
export const CHART_OTHER = "#8a8aa8";
