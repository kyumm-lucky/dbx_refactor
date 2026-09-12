export const APP_FONT_SANS_CSS_VAR = "--font-sans";
export const DATA_GRID_FONT_FAMILY_CSS_VAR = "--dbx-data-grid-font-family";

// System SF stack, matching the OS the app is designed against. The bundled
// Geist face used to lead this stack; it is still shipped and still
// selectable, but it is no longer the default because it is not the OS face
// and its narrower CJK fallback made mixed Chinese/Latin rows inconsistent.
export const DEFAULT_UI_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif`;
export const DEFAULT_DATA_GRID_FONT_FAMILY = `"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace`;
// Code and SQL surfaces follow the same mono stack as the grid, per the
// typography spec. The old default led with Fira Code, which is still offered
// in the font picker.
export const DEFAULT_EDITOR_FONT_FAMILY = `"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace`;

// Native-feeling UI option without DBX's bundled/brand font at the front of the stack.
export const SYSTEM_UI_FONT_FAMILY = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

// Values persisted before the SF default landed. Loading these as "the
// default" lets existing installs pick up the new face instead of being pinned
// to a font they never explicitly chose.
export const LEGACY_DEFAULT_UI_FONT_FAMILIES: readonly string[] = [`"Geist Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif`];
export const LEGACY_DEFAULT_DATA_GRID_FONT_FAMILIES: readonly string[] = [`'Apple Braille', monospace`];
export const LEGACY_DEFAULT_EDITOR_FONT_FAMILIES: readonly string[] = [`'Fira Code', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', monospace`];

export function normalizeUiFontFamily(value: string | undefined | null): string {
  if (!value) return DEFAULT_UI_FONT_FAMILY;
  return LEGACY_DEFAULT_UI_FONT_FAMILIES.includes(value) ? DEFAULT_UI_FONT_FAMILY : value;
}

export function normalizeDataGridFontFamily(value: string | undefined | null): string {
  if (!value) return DEFAULT_DATA_GRID_FONT_FAMILY;
  return LEGACY_DEFAULT_DATA_GRID_FONT_FAMILIES.includes(value) ? DEFAULT_DATA_GRID_FONT_FAMILY : value;
}

export function normalizeEditorFontFamily(value: string | undefined | null): string {
  if (!value) return DEFAULT_EDITOR_FONT_FAMILY;
  return LEGACY_DEFAULT_EDITOR_FONT_FAMILIES.includes(value) ? DEFAULT_EDITOR_FONT_FAMILY : value;
}

export const FONT_FAMILIES: { value: string; label: string }[] = [
  { value: "'Fira Code', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', monospace", label: "Fira Code" },
  { value: "'JetBrains Mono', 'Fira Code', monospace", label: "JetBrains Mono" },
  { value: "'Cascadia Code', 'Cascadia Mono', monospace", label: "Cascadia Code" },
  { value: "'Source Code Pro', monospace", label: "Source Code Pro" },
  { value: "'SF Mono', 'Menlo', monospace", label: "SF Mono / Menlo" },
  { value: "'Consolas', 'Courier New', monospace", label: "Consolas" },
  { value: "monospace", label: "System Monospace" },
];

export function cssFontFamilyForName(name: string): string {
  return `'${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', monospace`;
}

export function readableFontFamily(value: string): string {
  const firstFamily = value.split(",")[0]?.trim() ?? value;
  return firstFamily.replace(/^['"]|['"]$/g, "").replace(/\\'/g, "'");
}

export function normalizeCustomFontFamilyInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes(",") || trimmed.includes("'") || trimmed.includes('"')) return trimmed;
  return cssFontFamilyForName(trimmed);
}
