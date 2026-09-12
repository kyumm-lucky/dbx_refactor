import { describe, expect, it } from "vitest";
import { normalizeAppAccentColor, normalizeAppCornerStyle, normalizeAppThemePalette } from "@/lib/app/appTheme";

describe("app corner style", () => {
  it.each([
    [null, "standard"],
    ["", "standard"],
    ["invalid", "standard"],
    ["compact", "compact"],
    // The retired none/small/large triple all resolve to the default.
    ["none", "standard"],
    ["small", "standard"],
    ["large", "standard"],
  ])("normalizes %s to %s", (value, expected) => {
    expect(normalizeAppCornerStyle(value)).toBe(expected);
  });
});

describe("app accent color", () => {
  it.each([
    [null, "system"],
    ["", "system"],
    ["chartreuse", "system"],
    ["system", "system"],
    ["blue", "blue"],
    ["purple", "purple"],
    ["pink", "pink"],
    ["orange", "orange"],
    ["green", "green"],
    ["red", "red"],
  ])("normalizes %s to %s", (value, expected) => {
    expect(normalizeAppAccentColor(value)).toBe(expected);
  });
});

describe("app theme palette", () => {
  it("keeps the five current palettes", () => {
    for (const palette of ["system", "graphite", "cobalt", "amber", "custom"]) {
      expect(normalizeAppThemePalette(palette)).toBe(palette);
    }
  });

  it.each([
    [null, "system"],
    ["unknown-palette", "system"],
    // Neutral greys and editor-imitating sets collapse onto the neutral surfaces.
    ["pearl", "system"],
    ["mist", "graphite"],
    ["sage", "graphite"],
    ["vscode", "system"],
    // Blue and warm sets keep their hue.
    ["idea", "cobalt"],
    ["xcode", "cobalt"],
    ["jetbrains", "cobalt"],
    ["cursor", "cobalt"],
    ["blush", "amber"],
    ["claude", "amber"],
  ])("maps legacy %s to %s", (value, expected) => {
    expect(normalizeAppThemePalette(value)).toBe(expected);
  });
});
