import { describe, expect, it } from "vitest";
import { cssFontFamilyForName, DEFAULT_MONO_FALLBACK_FONTS, DEFAULT_MONO_FONT_FAMILY, FONT_FAMILIES, LEGACY_PRESET_FONT_MAP, normalizeCustomFontFamilyInput, readableFontFamily } from "../appFonts";
import { displayFontFamily, isPresetFontFamily } from "../fontFamilyOptions";

describe("appFonts", () => {
  it("includes CJK fallbacks in DEFAULT_MONO_FALLBACK_FONTS", () => {
    expect(DEFAULT_MONO_FALLBACK_FONTS).toContain("PingFang SC");
    expect(DEFAULT_MONO_FALLBACK_FONTS).toContain("Hiragino Sans GB");
    expect(DEFAULT_MONO_FALLBACK_FONTS).toContain("Microsoft YaHei");
    expect(DEFAULT_MONO_FALLBACK_FONTS.indexOf("monospace")).toBeLessThan(DEFAULT_MONO_FALLBACK_FONTS.indexOf('"PingFang SC"'));
  });

  it("keeps the system fallback monospaced before proportional CJK fonts", () => {
    expect(DEFAULT_MONO_FALLBACK_FONTS).toMatch(/^ui-monospace/);
    expect(DEFAULT_MONO_FALLBACK_FONTS.indexOf("monospace")).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_MONO_FALLBACK_FONTS.indexOf("monospace")).toBeLessThan(DEFAULT_MONO_FALLBACK_FONTS.indexOf('"Microsoft YaHei"'));
  });

  it("appends CJK fallbacks to every preset font family", () => {
    for (const preset of FONT_FAMILIES) {
      expect(preset.value).toContain(DEFAULT_MONO_FALLBACK_FONTS);
    }
  });

  it("maps legacy preset values to updated stacks with CJK fallbacks", () => {
    expect(LEGACY_PRESET_FONT_MAP["'Fira Code', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', monospace"]).toBe(DEFAULT_MONO_FONT_FAMILY);
    expect(LEGACY_PRESET_FONT_MAP[`'Fira Code', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace`]).toBe(DEFAULT_MONO_FONT_FAMILY);
    expect(LEGACY_PRESET_FONT_MAP["'JetBrains Mono', 'Fira Code', monospace"]).toContain(DEFAULT_MONO_FALLBACK_FONTS);
    expect(LEGACY_PRESET_FONT_MAP["'Consolas', 'Courier New', monospace"]).toContain(DEFAULT_MONO_FALLBACK_FONTS);
    expect(LEGACY_PRESET_FONT_MAP[`"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace`]).toBe(DEFAULT_MONO_FALLBACK_FONTS);
    expect(LEGACY_PRESET_FONT_MAP["monospace"]).toBe(DEFAULT_MONO_FALLBACK_FONTS);
  });

  it("constructs CSS font family for system font name with CJK fallbacks", () => {
    expect(cssFontFamilyForName("Ubuntu Mono")).toBe(`'Ubuntu Mono', ${DEFAULT_MONO_FALLBACK_FONTS}`);
    expect(cssFontFamilyForName("JetBrains Mono")).toBe(`'JetBrains Mono', ${DEFAULT_MONO_FALLBACK_FONTS}`);
    expect(cssFontFamilyForName("Font's Name")).toBe(`'Font\\'s Name', ${DEFAULT_MONO_FALLBACK_FONTS}`);
  });

  it("normalizes custom font family input", () => {
    expect(normalizeCustomFontFamilyInput("")).toBe("");
    expect(normalizeCustomFontFamilyInput("   ")).toBe("");
    expect(normalizeCustomFontFamilyInput("Hack")).toBe(`'Hack', ${DEFAULT_MONO_FALLBACK_FONTS}`);
    // Custom font stacks with quotes or commas are preserved verbatim
    expect(normalizeCustomFontFamilyInput("'My Custom Font', monospace")).toBe("'My Custom Font', monospace");
    expect(normalizeCustomFontFamilyInput("Fira Code, PingFang SC, monospace")).toBe("Fira Code, PingFang SC, monospace");
  });
});
