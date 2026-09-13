import { safeJsonFormat } from "@/lib/common/safeJsonFormat";

export const CELL_DETAIL_JSON_FORMAT_MAX_LENGTH = 50_000;

export function isJsonColumnType(columnType: string | undefined): boolean {
  const base = (columnType ?? "")
    .trim()
    .toLowerCase()
    .split(/[(:\s]/)[0];
  return base === "json" || base === "jsonb";
}

export function isGeometryColumnType(columnType: string | undefined): boolean {
  const base = (columnType ?? "")
    .trim()
    .toLowerCase()
    .split(/[(:\s]/)[0];
  return base === "geometry" || base === "geography";
}

export function formatJsonText(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > CELL_DETAIL_JSON_FORMAT_MAX_LENGTH) return undefined;
  try {
    return safeJsonFormat(trimmed, 2);
  } catch {
    return undefined;
  }
}
