import type { DataTableTabView, QueryTab } from "@/types/database";

/**
 * Data-table tabs remember their top-level view on the tab, so switching to
 * another tab and back restores what the user was looking at. An undefined
 * value means "never switched": the default is the structure view.
 */
export const DEFAULT_DATA_TABLE_VIEW: DataTableTabView = "structure";

export function dataTableTabView(tab: Pick<QueryTab, "mode" | "tableView">): DataTableTabView {
  if (tab.mode !== "data") return "data";
  return tab.tableView === "data" ? "data" : DEFAULT_DATA_TABLE_VIEW;
}

/**
 * Structure drafts are shared by the standalone structure tab and by data
 * tabs (the structure view edits the same draft model), so both surfaces owe
 * the user the same unsaved-changes protection.
 */
export function hasPendingStructureDraft(tab: Pick<QueryTab, "structureDraft">): boolean {
  return tab.structureDraft !== undefined && tab.structureDraft !== null && tab.structureDraft.dirty !== false;
}
