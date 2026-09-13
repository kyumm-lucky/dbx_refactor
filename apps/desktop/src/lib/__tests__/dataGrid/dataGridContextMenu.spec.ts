import { describe, expect, it, vi } from "vitest";
import { createDataGridCellContextMenuItems, createDataGridColumnContextMenuItems, createDataGridCompactColumnActionItems, createDataGridFilterSubmenu, createDataGridRowContextMenuItems } from "@/lib/dataGrid/dataGridContextMenu";

const icon = {};

describe("dataGridContextMenu", () => {
  it("omits database sort entries from the column context menu when database sort is unsupported", () => {
    const action = vi.fn();
    const filter = createDataGridFilterSubmenu({
      label: "filter",
      icon,
      labels: { equals: "equals", notEquals: "not equals", like: "like", notLike: "not like", lessThan: "less", greaterThan: "greater", isNull: "null", isNotNull: "not null", clear: "clear" },
      apply: action,
      clear: action,
    });
    const items = createDataGridColumnContextMenuItems({
      headerColumn: false,
      contextColumn: true,
      canCopyAlterSql: false,
      canFilter: true,
      hasSort: true,
      sortMode: "database",
      databaseSortEnabled: false,
      labels: { copyName: "copy name", copyNames: "copy names", details: "details", copyAlterSql: "alter", databaseAscending: "db asc", databaseDescending: "db desc", localAscending: "local asc", localDescending: "local desc", clearSort: "clear sort" },
      icons: { copy: icon, columnDetails: icon, database: icon, ascending: icon, descending: icon, clearSort: icon },
      actions: { copyName: action, copyNames: action, details: action, copyAlterSql: action, sort: action },
      filterSubmenu: filter,
    });
    expect(items.map((item) => item.label)).toEqual(["local asc", "local desc", "clear sort", "", "filter"]);
  });

  it("omits unavailable server actions and disables unavailable formatter", () => {
    const items = createDataGridCompactColumnActionItems({
      labels: { formatter: "formatter", clearFormatter: "clear formatter", localFilter: "local", serverFilter: "server", clearSort: "clear sort" },
      icons: { formatter: icon, clearFormatter: icon, filter: icon, database: icon, clearSort: icon },
      formatterAvailable: false,
      formatterActive: false,
      serverFilterAvailable: false,
      sorted: false,
    });
    expect(items.map((item) => item.value)).toEqual(["formatter", "localFilter", "clearFormatter", "clearSort"]);
    expect(items[0]?.disabled).toBe(true);
    expect(items[0]?.checked).toBe(false);
    expect(items.at(-2)).toMatchObject({ disabled: true, separatorBefore: true });
    expect(items.at(-1)).toMatchObject({ disabled: true, separatorBefore: true });
  });

  it("marks an active formatter and enables the compact clear actions", () => {
    const items = createDataGridCompactColumnActionItems({
      labels: { formatter: "formatter", clearFormatter: "clear formatter", localFilter: "local", serverFilter: "server", clearSort: "clear sort" },
      icons: { formatter: icon, clearFormatter: icon, filter: icon, database: icon, clearSort: icon },
      formatterAvailable: true,
      formatterActive: true,
      serverFilterAvailable: true,
      sorted: true,
    });
    expect(items[0]).toMatchObject({ value: "formatter", checked: true, disabled: false });
    expect(items.at(-2)).toMatchObject({ value: "clearFormatter", disabled: false, separatorBefore: true });
    expect(items.at(-1)).toMatchObject({ value: "clearSort", disabled: false, separatorBefore: true });
  });

  it("builds typed column, cell, and row capability groups", () => {
    const action = vi.fn();
    const filter = createDataGridFilterSubmenu({
      label: "filter",
      icon,
      labels: { equals: "equals", notEquals: "not equals", like: "like", notLike: "not like", lessThan: "less", greaterThan: "greater", isNull: "null", isNotNull: "not null", clear: "clear" },
      apply: action,
      clear: action,
    });
    const columnItems = createDataGridColumnContextMenuItems({
      headerColumn: true,
      contextColumn: true,
      canCopyAlterSql: true,
      canFilter: true,
      hasSort: true,
      sortMode: "database",
      labels: { copyName: "copy name", copyNames: "copy names", details: "details", copyAlterSql: "alter", databaseAscending: "db asc", databaseDescending: "db desc", localAscending: "local asc", localDescending: "local desc", clearSort: "clear sort" },
      icons: { copy: icon, columnDetails: icon, database: icon, ascending: icon, descending: icon, clearSort: icon },
      actions: { copyName: action, copyNames: action, details: action, copyAlterSql: action, sort: action },
      filterSubmenu: filter,
    });
    expect(columnItems.map((item) => item.label)).toContain("filter");

    const cellItems = createDataGridCellContextMenuItems({
      hasCell: true,
      hasColumn: true,
      headerColumn: false,
      editable: true,
      hasCellSelection: true,
      hasEditableSelection: false,
      hasSelection: true,
      labels: { cellDetails: "cell", columnDetails: "column", rowDetails: "row", setNull: "null", bulkEdit: "bulk", transpose: "transpose" },
      icons: { cellDetails: icon, columnDetails: icon, rowDetails: icon, setNull: icon, bulkEdit: icon, transpose: icon },
      actions: { cellDetails: action, columnDetails: action, rowDetails: action, setNull: action, bulkEdit: action, transpose: action },
      importItem: { label: "import" },
      downloadItem: { label: "download" },
      copySubmenu: { label: "copy" },
      clearSelectionItem: { label: "clear" },
    });
    expect(cellItems.slice(0, 4).map((item) => item.label)).toEqual(["cell", "import", "download", "column"]);
    expect(cellItems.find((item) => item.label === "bulk")?.disabled).toBe(true);

    const rowItems = createDataGridRowContextMenuItems({
      editable: true,
      hasRow: true,
      canClone: true,
      deleted: false,
      canDelete: true,
      labels: { clone: "clone", restore: "restore", delete: "delete" },
      icons: { clone: icon, restore: icon, delete: icon },
      actions: { clone: action, restore: action, delete: action },
    });
    expect(rowItems.find((item) => item.label === "delete")?.variant).toBe("destructive");
  });
});
