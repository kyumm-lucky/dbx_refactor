import { readFileSync } from "node:fs";
import { reactive } from "vue";
import { describe, expect, it } from "vitest";
import {
  DATA_GRID_TYPE_COLOR_KEYS,
  DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID,
  DEFAULT_DATA_GRID_TYPE_COLORS_DARK,
  DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT,
  cloneDataGridTypeColorSchemes,
  dataGridTypeColorCssVar,
  defaultDataGridTypeColors,
  normalizeActiveDataGridTypeColorSchemeId,
  normalizeDataGridTypeColorSchemes,
  normalizeDataGridTypeColors,
  resolveActiveDataGridTypeColors,
  type DataGridTypeColorScheme,
} from "@/lib/dataGrid/dataGridTypeColorScheme";

const globalStylesSource = readFileSync(new URL("../../../styles/globals.css", import.meta.url), "utf8");
const tokenStylesSource = readFileSync(new URL("../../../styles/tokens.css", import.meta.url), "utf8");

function cssBlockVariables(selector: string, source = globalStylesSource, prefix = "--data-grid-type-"): Record<string, string> {
  const start = source.indexOf(`${selector} {`);
  expect(start, `${selector} block is missing`).toBeGreaterThanOrEqual(0);
  const block = source.slice(start, source.indexOf("}", start));
  const found: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(new RegExp(`(${prefix}[\\w-]+):\\s*([^;]+);`, "g"))) {
    found[name] = value.trim();
  }
  return found;
}

/*
 * The nine type keys share four colours, declared once as `--cell-*` tokens in
 * tokens.css and referenced from globals.css. Resolve that one level of
 * indirection so this stays a real drift check on the shipped hex values
 * rather than a check that a `var()` is spelled correctly.
 */
function resolveCellToken(value: string, selector: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(value);
  if (!match) return toHex(value);
  const resolved = cssBlockVariables(selector, tokenStylesSource, "--cell-")[match[1]];
  expect(resolved, `${match[1]} is missing from tokens.css`).toBeTruthy();
  return toHex(resolved);
}

/** Tokens.css declares space-separated rgb(); the TS defaults are hex. */
function toHex(value: string): string {
  const match = /^rgb\((\d+)\s+(\d+)\s+(\d+)\)$/.exec(value.trim());
  if (!match) return value.trim();
  return `#${[match[1], match[2], match[3]].map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}

function scheme(id: string, overrides: Partial<Record<string, string>> = {}): DataGridTypeColorScheme {
  return { id, name: id, colors: { ...DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT, ...overrides } };
}

describe("data grid type color keys", () => {
  it("covers every visual kind except the neutral unknown", () => {
    expect(DATA_GRID_TYPE_COLOR_KEYS).toEqual(["integer", "numeric", "string", "boolean", "temporal", "structured", "identifier", "binary", "spatial"]);
    expect(DATA_GRID_TYPE_COLOR_KEYS).not.toContain("unknown");
  });

  it("keeps the built-in palettes in sync with globals.css", () => {
    // The stylesheet cannot import the TS defaults, so drift has to be caught
    // here. The type keys resolve through the shared `--cell-*` tokens, which
    // is where light and dark actually diverge.
    const typeVars = cssBlockVariables(":root");

    for (const key of DATA_GRID_TYPE_COLOR_KEYS) {
      const declaration = typeVars[dataGridTypeColorCssVar(key)];
      expect(resolveCellToken(declaration, ":root")).toBe(DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT[key]);
      expect(resolveCellToken(declaration, ".dark")).toBe(DEFAULT_DATA_GRID_TYPE_COLORS_DARK[key]);
    }
  });

  it("selects the palette matching the appearance", () => {
    expect(defaultDataGridTypeColors(false)).toEqual(DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT);
    expect(defaultDataGridTypeColors(true)).toEqual(DEFAULT_DATA_GRID_TYPE_COLORS_DARK);
  });
});

describe("data grid type color normalization", () => {
  it("clones Vue reactive schemes into detached plain data", () => {
    const schemes = reactive([scheme("mine", { integer: "#123456" })]);

    const cloned = cloneDataGridTypeColorSchemes(schemes);

    expect(cloned).toEqual(schemes);
    cloned[0].colors.integer = "#abcdef";
    expect(schemes[0].colors.integer).toBe("#123456");
  });

  it("keeps valid six-digit hex values", () => {
    expect(normalizeDataGridTypeColors({ ...DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT, integer: "#ABCDEF" }).integer).toBe("#ABCDEF");
  });

  it.each([["#fff"], ["red"], ["rgb(0,0,0)"], ["#12345g"], [""], [42], [null]])("falls back for the unusable value %p", (value) => {
    expect(normalizeDataGridTypeColors({ integer: value }).integer).toBe(DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT.integer);
  });

  it("fills every missing key from the supplied fallback palette", () => {
    expect(normalizeDataGridTypeColors({}, DEFAULT_DATA_GRID_TYPE_COLORS_DARK)).toEqual(DEFAULT_DATA_GRID_TYPE_COLORS_DARK);
  });

  it.each([[undefined], [null], ["nope"], [{}]])("treats the non-array scheme list %p as empty", (value) => {
    expect(normalizeDataGridTypeColorSchemes(value)).toEqual([]);
  });

  it("drops entries without a usable id and de-duplicates the rest", () => {
    const result = normalizeDataGridTypeColorSchemes([scheme("keep"), { id: "  " }, { name: "no id" }, scheme("keep"), null]);

    expect(result.map((entry) => entry.id)).toEqual(["keep"]);
  });

  it("refuses a persisted scheme claiming the reserved auto id", () => {
    expect(normalizeDataGridTypeColorSchemes([scheme(DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID)])).toEqual([]);
  });

  it("falls back to the id when a scheme has no usable name", () => {
    expect(normalizeDataGridTypeColorSchemes([{ id: "abc", colors: DEFAULT_DATA_GRID_TYPE_COLORS_LIGHT }])[0].name).toBe("abc");
  });
});

describe("active data grid type color scheme", () => {
  const schemes = [scheme("mine", { integer: "#123456" })];

  it("keeps an id that resolves to a scheme", () => {
    expect(normalizeActiveDataGridTypeColorSchemeId(schemes, "mine")).toBe("mine");
  });

  it.each([["deleted"], [undefined], [null], [7]])("falls back to auto for the unresolvable id %p", (value) => {
    expect(normalizeActiveDataGridTypeColorSchemeId(schemes, value)).toBe(DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID);
  });

  it("returns no override under auto so the stylesheet keeps following the theme", () => {
    expect(resolveActiveDataGridTypeColors(schemes, DATA_GRID_TYPE_COLOR_SCHEME_AUTO_ID)).toBeNull();
  });

  it("returns the selected palette", () => {
    expect(resolveActiveDataGridTypeColors(schemes, "mine")?.integer).toBe("#123456");
  });

  it("returns no override when the active scheme is missing", () => {
    expect(resolveActiveDataGridTypeColors(schemes, "gone")).toBeNull();
  });
});
