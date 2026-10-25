import type { DataTableTabView, QueryTab } from "@/types/database";

/**
 * 数据表标签页把顶层视图记在标签页上，切到别的标签再回来时恢复用户离开时的
 * 视图。未记录（undefined）表示用户从未切换过，默认显示表数据视图。
 */
export const DEFAULT_DATA_TABLE_VIEW: DataTableTabView = "data";

export function dataTableTabView(tab: Pick<QueryTab, "mode" | "tableView">): DataTableTabView {
  if (tab.mode !== "data") return "data";
  return tab.tableView === "structure" ? "structure" : DEFAULT_DATA_TABLE_VIEW;
}

/**
 * Structure drafts are shared by the standalone structure tab and by data
 * tabs (the structure view edits the same draft model), so both surfaces owe
 * the user the same unsaved-changes protection.
 */
export function hasPendingStructureDraft(tab: Pick<QueryTab, "structureDraft">): boolean {
  return tab.structureDraft !== undefined && tab.structureDraft !== null && tab.structureDraft.dirty !== false;
}
