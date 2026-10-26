import type { DataGridTypeVisualKind } from "@/lib/dataGrid/dataGridColumnType";
import { DATA_GRID_TYPE_COLOR_KEYS, dataGridTypeColorCssVar, defaultDataGridTypeColors } from "@/lib/dataGrid/dataGridTypeColorScheme";

export type DataGridTypeForegrounds = Record<DataGridTypeVisualKind, string>;

export interface DataGridPaintTheme {
  background: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  rowMuted: string;
  rowNew: string;
  rowDeleted: string;
  /** 行底线（Apple 极简网格只画行发丝线，不画单元格竖线） */
  rowLine: string;
  /** 整行 hover 底色：hoverCell 命中某行时整行填充 */
  rowHover: string;
  /** 整行选中底色：rowCellsUseSelectionVisual 的行整行填充 */
  rowSelected: string;
  cellActive: string;
  cellCrosshairRow: string;
  cellCrosshairCol: string;
  cellDirty: string;
  /** 脏单元格左侧 2px 标记条，同时用于编辑行行号左侧的琥珀圆点 */
  cellDirtyBar: string;
  cellSelected: string;
  cellSelectedDirty: string;
  cellSelectedBorder: string;
  cellSelectedSingle: string;
  cellSelectedSingleBorder: string;
  cellHover: string;
  cellSearch: string;
  cellCurrentSearch: string;
  cellCurrentSearchBorder: string;
  rowNumberDefault: string;
  rowNumberNew: string;
  rowNumberEdited: string;
  rowNumberDeleted: string;
  rowNumberActive: string;
  rowNumberSelected: string;
  rowNumberTextClean: string;
  /** 选中行的行号文字色（Apple：行号变系统蓝，不再用前景色） */
  rowNumberSelectedText: string;
  rowNumberTextNew: string;
  rowNumberTextEdited: string;
  rowNumberTextDeleted: string;
  typeForegrounds: DataGridTypeForegrounds;
}

export const DATA_GRID_DARK_SEARCH_COLORS = {
  match: "rgb(72, 57, 8)",
  current: "rgb(116, 87, 0)",
  currentBorder: "rgb(239, 177, 0)",
} as const;
// 活动行底色降级常量：需在白底/斑马纹上清晰可辨（避免看岔行，#11649）。实际取值由
// --data-grid-cell-active-bg / --data-grid-row-number-active-bg 提供（Apple 视觉为 4%/6% 主色），
// 变量未设置时才回落到这里的常量。
export const DATA_GRID_LIGHT_ACTIVE_ROW_BG = "rgb(219, 234, 254)";
export const DATA_GRID_DARK_ACTIVE_ROW_BG = "rgb(27, 46, 70)";
// 十字行/列底色：混入背景的实色（color-mix(in srgb, var(--primary) P%, var(--background))），
// 而非透明叠加——铺在浅底上的半透明色会被冲淡到几乎不可见，对比度不足正 jira #7276 的核心痛点。
// 行/列占 primary 34%/50%（CSS 方向：P% primary + 其余 background）；现有 28%/40% 在浅色
// 主题的大面积网格中仍不够醒目。列更重，交点通过 Canvas 的两次绘制进一步加深；选中格仍以显式
// 填充与描边优先，故不会被十字高亮覆盖。
// 常量按默认主题 soft-light/dark（primary/background）混合得出，作为 var 未设置 / 旧浏览器
// 降级实色；color-mix 支持时网格组件的 CSS 变量会用它重新混成 —— 两处取值一致。
export const DATA_GRID_LIGHT_CROSSHAIR_ROW_BG = "rgb(174, 195, 224)";
export const DATA_GRID_LIGHT_CROSSHAIR_COL_BG = "rgb(142, 170, 210)";
export const DATA_GRID_DARK_CROSSHAIR_ROW_BG = "rgb(75, 84, 98)";
export const DATA_GRID_DARK_CROSSHAIR_COL_BG = "rgb(98, 111, 130)";
export const DATA_GRID_LIGHT_STRIPED_ROW_BG = "rgb(240, 240, 240)";
export const DATA_GRID_DARK_STRIPED_ROW_BG = "rgb(40, 40, 43)";
// 新增行（未落库的待插入行）整行底色，必须与普通行、斑马纹行「一眼可辨」（#11634）：
// 用与行号列 --data-grid-row-number-new-bg 同族的 emerald，但强度更低（10% vs 15%），
// 使整行有绿调的同时，行号标记（填写后才出现）仍然比行底色更醒目。取值与网格组件的
// --data-grid-row-new-bg（含 color-mix 变体）保持一致。
export const DATA_GRID_LIGHT_NEW_ROW_BG = "rgb(231, 248, 242)";
export const DATA_GRID_DARK_NEW_ROW_BG = "rgb(19, 37, 33)";
export const DATA_GRID_DARK_ROW_NUMBER_BG = "rgb(35, 37, 42)";
const DATA_GRID_DARK_ROW_NUMBER_NEW_BG = "rgb(33, 45, 40)";
const DATA_GRID_DARK_ROW_NUMBER_EDITED_BG = "rgb(48, 41, 28)";
const DATA_GRID_DARK_ROW_NUMBER_DELETED_BG = "rgb(55, 31, 32)";
const DATA_GRID_LIGHT_ROW_NUMBER_NEW_BG = "rgb(219, 244, 233)";
const DATA_GRID_LIGHT_ROW_NUMBER_EDITED_BG = "rgb(253, 241, 219)";
const DATA_GRID_LIGHT_ROW_NUMBER_DELETED_BG = "rgb(255, 244, 244)";
// Apple 极简网格：行只有发丝底线，hover/选中是整行浅底，脏格带琥珀左条、编辑行在行号左侧
// 画琥珀点。降级常量与 tokens.css 的 --dbx-grid-* 取值一致，仅在变量未设置时使用。
const DATA_GRID_LIGHT_ROW_LINE = "rgba(0, 0, 0, 0.055)";
const DATA_GRID_DARK_ROW_LINE = "rgba(255, 255, 255, 0.07)";
const DATA_GRID_LIGHT_ROW_HOVER = "rgb(246, 246, 248)";
const DATA_GRID_DARK_ROW_HOVER = "rgb(42, 42, 45)";
const DATA_GRID_LIGHT_ROW_SELECTED = "rgba(0, 113, 227, 0.1)";
const DATA_GRID_DARK_ROW_SELECTED = "rgba(10, 132, 255, 0.18)";
const DATA_GRID_LIGHT_CELL_DIRTY_BAR = "rgb(163, 79, 0)";
const DATA_GRID_DARK_CELL_DIRTY_BAR = "rgb(255, 159, 10)";
const DATA_GRID_LIGHT_ROW_NUMBER_SELECTED_TEXT = "rgb(0, 98, 196)";
const DATA_GRID_DARK_ROW_NUMBER_SELECTED_TEXT = "rgb(124, 196, 255)";
const CANVAS_SAFE_COLOR_RE = /^(#|rgb\(|rgba\(|hsl\(|hsla\()/i;
const ADVANCED_COLOR_RE = /^(oklch\(|oklab\(|lab\(|lch\(|color\(|color-mix\()/i;
let browserColorProbe: HTMLElement | null = null;
let canvasColorProbe: CanvasRenderingContext2D | null | undefined;

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseAlpha(value: string | undefined): number {
  if (!value) return 1;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) return clamp(Number.parseFloat(trimmed) / 100, 0, 1);
  return clamp(Number.parseFloat(trimmed), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatAlpha(value: number): string {
  return Number(clamp(value, 0, 1).toFixed(3)).toString();
}

function formatRgb(color: RgbaColor): string {
  const r = Math.round(clamp(color.r, 0, 255));
  const g = Math.round(clamp(color.g, 0, 255));
  const b = Math.round(clamp(color.b, 0, 255));
  if (color.a < 1) return `rgba(${r}, ${g}, ${b}, ${formatAlpha(color.a)})`;
  return `rgb(${r}, ${g}, ${b})`;
}

function parseRgbColor(value: string): RgbaColor | null {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const fullHex = hex.length === 3 ? [...hex].map((char) => `${char}${char}`).join("") : hex;
    return {
      r: Number.parseInt(fullHex.slice(0, 2), 16),
      g: Number.parseInt(fullHex.slice(2, 4), 16),
      b: Number.parseInt(fullHex.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgb = value.match(/^rgba?\((.+)\)$/i)?.[1]?.trim();
  if (!rgb) return null;
  const parts = rgb.includes(",") ? rgb.split(",").map((part) => part.trim()) : rgb.replace(/\s+\/\s+/, " / ").split(/\s+/);
  const slashIndex = parts.indexOf("/");
  const channels = slashIndex >= 0 ? parts.slice(0, slashIndex) : parts.slice(0, 3);
  const alpha = slashIndex >= 0 ? parts[slashIndex + 1] : parts[3];
  if (channels.length < 3) return null;
  const [r, g, b] = channels.map((part) => Number.parseFloat(part));
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b, a: parseAlpha(alpha) };
}

function splitTopLevelCommas(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}

function parseColorStop(value: string): { color: string; percent?: number } | null {
  const match = value.match(/^(.*)\s+([0-9.]+)%$/);
  if (!match) return { color: value.trim() };
  return {
    color: match[1]?.trim() ?? "",
    percent: Number.parseFloat(match[2] ?? ""),
  };
}

function mixRgb(first: RgbaColor, firstPercent: number, second: RgbaColor, secondPercent: number): RgbaColor {
  const total = firstPercent + secondPercent || 100;
  const firstWeight = firstPercent / total;
  const secondWeight = secondPercent / total;
  return {
    r: first.r * firstWeight + second.r * secondWeight,
    g: first.g * firstWeight + second.g * secondWeight,
    b: first.b * firstWeight + second.b * secondWeight,
    a: first.a * firstWeight + second.a * secondWeight,
  };
}

function parseColorMix(value: string): string | null {
  // Crosshair tokens use sRGB so Canvas can reproduce the DOM blend exactly.
  const body = value.match(/^color-mix\(\s*in\s+(?:srgb|oklab)\s*,\s*(.*)\)$/i)?.[1];
  if (!body) return null;
  const [firstRaw, secondRaw] = splitTopLevelCommas(body);
  if (!firstRaw || !secondRaw) return null;
  const first = parseColorStop(firstRaw);
  const second = parseColorStop(secondRaw);
  if (!first?.color || !second?.color || first.percent === undefined) return null;
  const firstColor = parseRgbColor(toCanvasSafeColor(first.color, ""));
  if (!firstColor) return null;
  const secondPercent = second.percent ?? 100 - first.percent;
  if (second.color.toLowerCase() === "transparent") {
    return formatRgb({ ...firstColor, a: firstColor.a * (first.percent / 100) });
  }
  const secondColor = parseRgbColor(toCanvasSafeColor(second.color, ""));
  if (!secondColor) return null;
  return formatRgb(mixRgb(firstColor, first.percent, secondColor, secondPercent));
}

function normalizeCssColorWithBrowser(value: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    browserColorProbe ??= document.createElement("span");
    const probe = browserColorProbe;
    probe.style.color = "";
    probe.style.color = value;
    if (!probe.style.color) return null;
    if (!probe.isConnected) {
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";
      document.body?.appendChild(probe);
    }
    const computed = getComputedStyle(probe).color.trim();
    return computed || null;
  } catch {
    return null;
  }
}

function normalizeColorWithCanvas(value: string): string | null {
  if (!value || typeof document === "undefined") return value || null;
  try {
    if (canvasColorProbe === undefined) {
      canvasColorProbe = document.createElement("canvas").getContext("2d");
    }
    const ctx = canvasColorProbe;
    if (!ctx) return value;

    ctx.fillStyle = "#010203";
    ctx.fillStyle = value;
    const first = String(ctx.fillStyle);
    if (first !== "#010203") return first;

    ctx.fillStyle = "#040506";
    ctx.fillStyle = value;
    const second = String(ctx.fillStyle);
    return second !== "#040506" ? second : null;
  } catch {
    return null;
  }
}

function toCanvasSafeColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const rgb = parseRgbColor(trimmed);
  const candidate = rgb ? formatRgb(rgb) : CANVAS_SAFE_COLOR_RE.test(trimmed) ? trimmed : ADVANCED_COLOR_RE.test(trimmed) ? (normalizeCssColorWithBrowser(trimmed) ?? parseColorMix(trimmed) ?? fallback) : `hsl(${trimmed})`;
  return normalizeColorWithCanvas(candidate) ?? normalizeColorWithCanvas(fallback) ?? fallback;
}

export function cssVarColor(getVar: (name: string) => string, name: string, fallback: string): string {
  return toCanvasSafeColor(getVar(name), fallback);
}

export function dataGridActiveRowBackground(isDark: boolean): string {
  return isDark ? DATA_GRID_DARK_ACTIVE_ROW_BG : DATA_GRID_LIGHT_ACTIVE_ROW_BG;
}

function resolveCssVarReferences(value: string, getVar: (name: string) => string, depth = 0): string {
  if (depth > 6 || !value.includes("var(")) return value;
  return value.replace(/var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)/g, (_match, name: string, fallback?: string) => {
    const resolved = getVar(name).trim() || fallback?.trim() || "";
    if (!resolved) return "";
    return resolveCssVarReferences(resolved, getVar, depth + 1);
  });
}

function paintToken(getVar: (name: string) => string, name: string, fallback: string): string {
  const value = resolveCssVarReferences(getVar(name).trim(), getVar);
  return toCanvasSafeColor(value, fallback);
}

export function resolveDataGridPaintTheme(options: { getVar: (name: string) => string; isDark: boolean }): DataGridPaintTheme {
  const { getVar, isDark } = options;
  const defaultBackground = isDark ? "rgb(19, 20, 22)" : "rgb(255, 255, 255)";
  const solidBackground = cssVarColor(getVar, "--background-solid", cssVarColor(getVar, "--background", defaultBackground));
  const background = paintToken(getVar, "--data-grid-background", solidBackground);
  const foreground = cssVarColor(getVar, "--foreground", isDark ? "rgb(215, 215, 219)" : "rgb(10, 10, 10)");
  const mutedForeground = cssVarColor(getVar, "--muted-foreground", isDark ? "rgb(151, 152, 157)" : "rgb(115, 115, 115)");
  const primary = cssVarColor(getVar, "--primary", isDark ? "rgb(208, 208, 214)" : "rgb(23, 23, 23)");
  const destructive = cssVarColor(getVar, "--destructive", isDark ? "rgb(243, 98, 95)" : "rgb(231, 0, 11)");
  const accent = cssVarColor(getVar, "--accent", isDark ? "rgb(46, 47, 51)" : "rgb(245, 245, 245)");
  const activeSurface = dataGridActiveRowBackground(isDark);
  const rowMuted = isDark ? DATA_GRID_DARK_STRIPED_ROW_BG : DATA_GRID_LIGHT_STRIPED_ROW_BG;
  const rowNew = isDark ? DATA_GRID_DARK_NEW_ROW_BG : DATA_GRID_LIGHT_NEW_ROW_BG;
  const rowDeleted = isDark ? "rgb(55, 31, 32)" : "rgb(255, 244, 244)";
  // Apple 极简网格新增的 5 个令牌都直接来自 :root/.dark 的 --dbx-grid-*，两种模式统一读变量，
  // 降级常量与 tokens.css 同值；深色不再走常量分支，否则网格组件里的变量映射在暗色下不生效。
  const rowLine = paintToken(getVar, "--dbx-grid-row-line", isDark ? DATA_GRID_DARK_ROW_LINE : DATA_GRID_LIGHT_ROW_LINE);
  const rowHover = paintToken(getVar, "--dbx-grid-row-hover", isDark ? DATA_GRID_DARK_ROW_HOVER : DATA_GRID_LIGHT_ROW_HOVER);
  const rowSelected = paintToken(getVar, "--dbx-grid-row-selected", isDark ? DATA_GRID_DARK_ROW_SELECTED : DATA_GRID_LIGHT_ROW_SELECTED);
  const cellActive = activeSurface;
  // 浅/深都读 CSS 变量（--data-grid-cell-crosshair-*-bg 从 --primary 派生），保证 DOM 与
  // Canvas 在不同主题/深浅模式下取到同一色源；固定常量仅作 var 未设置时的降级默认。
  const cellCrosshairRow = paintToken(getVar, "--data-grid-cell-crosshair-row-bg", isDark ? DATA_GRID_DARK_CROSSHAIR_ROW_BG : DATA_GRID_LIGHT_CROSSHAIR_ROW_BG);
  const cellCrosshairCol = paintToken(getVar, "--data-grid-cell-crosshair-col-bg", isDark ? DATA_GRID_DARK_CROSSHAIR_COL_BG : DATA_GRID_LIGHT_CROSSHAIR_COL_BG);
  const cellDirty = isDark ? "rgb(94, 75, 26)" : "rgb(255, 248, 230)";
  const cellDirtyBar = paintToken(getVar, "--dbx-grid-cell-dirty-bar", isDark ? DATA_GRID_DARK_CELL_DIRTY_BAR : DATA_GRID_LIGHT_CELL_DIRTY_BAR);
  const cellSelected = isDark ? "rgb(30, 64, 100)" : "rgb(179, 208, 254)";
  const cellSelectedDirty = isDark ? "rgb(76, 66, 38)" : "rgb(235, 224, 184)";
  const cellSelectedBorder = isDark ? "rgb(96, 165, 250)" : "rgb(37, 99, 235)";
  const cellSelectedSingle = isDark ? "rgb(30, 64, 96)" : "rgb(191, 219, 254)";
  const cellHover = accent;
  const cellSearch = isDark ? DATA_GRID_DARK_SEARCH_COLORS.match : "rgb(253, 245, 184)";
  const cellCurrentSearch = isDark ? DATA_GRID_DARK_SEARCH_COLORS.current : "rgba(253, 224, 71, 0.52)";
  const cellCurrentSearchBorder = isDark ? DATA_GRID_DARK_SEARCH_COLORS.currentBorder : "rgba(234, 179, 8, 0.82)";
  const rowNumberDefault = isDark ? DATA_GRID_DARK_ROW_NUMBER_BG : "rgb(255, 255, 255)";
  const rowNumberNew = isDark ? DATA_GRID_DARK_ROW_NUMBER_NEW_BG : DATA_GRID_LIGHT_ROW_NUMBER_NEW_BG;
  const rowNumberEdited = isDark ? DATA_GRID_DARK_ROW_NUMBER_EDITED_BG : DATA_GRID_LIGHT_ROW_NUMBER_EDITED_BG;
  const rowNumberDeleted = isDark ? DATA_GRID_DARK_ROW_NUMBER_DELETED_BG : DATA_GRID_LIGHT_ROW_NUMBER_DELETED_BG;
  const rowNumberActive = activeSurface;
  const rowNumberSelected = isDark ? "rgb(30, 64, 96)" : "rgb(191, 219, 254)";
  const rowNumberSelectedText = paintToken(getVar, "--dbx-grid-gutter-selected-fg", isDark ? DATA_GRID_DARK_ROW_NUMBER_SELECTED_TEXT : DATA_GRID_LIGHT_ROW_NUMBER_SELECTED_TEXT);
  const typeDefaults = defaultDataGridTypeColors(isDark);
  const typeForegrounds = { unknown: foreground } as DataGridTypeForegrounds;
  for (const key of DATA_GRID_TYPE_COLOR_KEYS) {
    typeForegrounds[key] = paintToken(getVar, dataGridTypeColorCssVar(key), typeDefaults[key]);
  }

  return {
    background,
    border: cssVarColor(getVar, "--border", isDark ? "rgb(63, 63, 70)" : "rgb(229, 231, 235)"),
    foreground,
    mutedForeground,
    primary,
    rowMuted: isDark ? rowMuted : paintToken(getVar, "--data-grid-row-muted-bg", rowMuted),
    rowNew: isDark ? rowNew : paintToken(getVar, "--data-grid-row-new-bg", rowNew),
    rowDeleted: isDark ? rowDeleted : paintToken(getVar, "--data-grid-row-deleted-bg", rowDeleted),
    rowLine,
    rowHover,
    rowSelected,
    // 活动行底色两种模式都读变量：网格组件会按 Apple 视觉重设 --data-grid-cell-active-bg，
    // 只在亮色读变量会让暗色画布停留在旧的活动行蓝（与 DOM 行底色不一致）。
    cellActive: paintToken(getVar, "--data-grid-cell-active-bg", cellActive),
    cellCrosshairRow,
    cellCrosshairCol,
    cellDirty: paintToken(getVar, "--data-grid-cell-dirty-bg", cellDirty),
    cellDirtyBar,
    cellSelected: paintToken(getVar, "--data-grid-cell-selected-bg", cellSelected),
    cellSelectedDirty: paintToken(getVar, "--data-grid-cell-selected-dirty-bg", cellSelectedDirty),
    cellSelectedBorder: paintToken(getVar, "--data-grid-cell-selected-border", cellSelectedBorder),
    cellSelectedSingle: paintToken(getVar, "--data-grid-cell-selected-single-bg", cellSelectedSingle),
    cellSelectedSingleBorder: paintToken(getVar, "--data-grid-cell-selected-single-border", primary),
    cellHover: isDark ? cellHover : paintToken(getVar, "--data-grid-cell-hover-bg", cellHover),
    cellSearch: isDark ? cellSearch : paintToken(getVar, "--data-grid-cell-search-bg", cellSearch),
    cellCurrentSearch: isDark ? cellCurrentSearch : paintToken(getVar, "--data-grid-cell-current-search-bg", cellCurrentSearch),
    cellCurrentSearchBorder: isDark ? cellCurrentSearchBorder : paintToken(getVar, "--data-grid-cell-current-search-border", cellCurrentSearchBorder),
    rowNumberDefault: paintToken(getVar, "--data-grid-row-number-default-bg", rowNumberDefault),
    rowNumberNew: isDark ? rowNumberNew : paintToken(getVar, "--data-grid-row-number-new-bg", rowNumberNew),
    rowNumberEdited: isDark ? rowNumberEdited : paintToken(getVar, "--data-grid-row-number-edited-bg", rowNumberEdited),
    rowNumberDeleted: isDark ? rowNumberDeleted : paintToken(getVar, "--data-grid-row-number-deleted-bg", rowNumberDeleted),
    rowNumberActive: paintToken(getVar, "--data-grid-row-number-active-bg", rowNumberActive),
    rowNumberSelected: paintToken(getVar, "--data-grid-row-number-selected-bg", rowNumberSelected),
    rowNumberTextClean: mutedForeground,
    rowNumberSelectedText,
    rowNumberTextNew: isDark ? "rgb(94, 233, 181)" : "rgb(0, 122, 85)",
    rowNumberTextEdited: isDark ? "rgb(255, 210, 48)" : "rgb(187, 77, 0)",
    rowNumberTextDeleted: destructive,
    typeForegrounds,
  };
}

export function dataGridTypeForeground(theme: Pick<DataGridPaintTheme, "foreground" | "typeForegrounds">, kind: DataGridTypeVisualKind): string {
  return theme.typeForegrounds[kind] ?? theme.foreground;
}
