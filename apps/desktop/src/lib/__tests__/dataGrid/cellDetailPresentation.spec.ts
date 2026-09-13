import { describe, expect, it } from "vitest";
import { formatJsonText, isGeometryColumnType, isJsonColumnType } from "@/lib/dataGrid/cellDetailPresentation";

describe("cellDetailPresentation", () => {
  it("formats JSON text and rejects empty or invalid input", () => {
    expect(formatJsonText('{\n"name":"DBX"\n}')).toBe('{\n  "name": "DBX"\n}');
    expect(formatJsonText("")).toBeUndefined();
    expect(formatJsonText("not json")).toBeUndefined();
  });

  it("detects JSON and geometry column types with precision suffixes", () => {
    expect(isJsonColumnType("jsonb")).toBe(true);
    expect(isJsonColumnType(" JSONB(255) ")).toBe(true);
    expect(isJsonColumnType("varchar(64)")).toBe(false);
    expect(isGeometryColumnType("geometry(Point, 4326)")).toBe(true);
    expect(isGeometryColumnType("GEOGRAPHY")).toBe(true);
    expect(isGeometryColumnType("text")).toBe(false);
  });
});
