import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adjacentDataGridDetailIndex, detailNavigationDelta, shouldIgnoreDataGridDetailNavigation } from "../../../lib/dataGrid/dataGridDetailNavigation";

const dataGridSource = readFileSync(new URL("../DataGrid.vue", import.meta.url), "utf8");
const detailDialogsSource = readFileSync(new URL("../DataGridDetailDialogs.vue", import.meta.url), "utf8");

function keyboardEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: "ArrowDown",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    target: null,
    currentTarget: {},
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
    ...overrides,
  } as unknown as KeyboardEvent;
}

function targetMatching(selectorPart: string): EventTarget {
  return { closest: (selector: string) => (selector.includes(selectorPart) ? {} : null) } as unknown as EventTarget;
}

function functionBody(source: string, name: string, nextName: string): string {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  return start >= 0 && end > start ? source.slice(start, end) : "";
}

/** Row-detail dialog table: from the row table up to the column-detail dialog. */
function rowDetailTableSource(): string {
  const start = detailDialogsSource.indexOf('<table class="w-full min-w-[560px] text-xs">');
  const end = detailDialogsSource.indexOf('<Dialog v-model:open="columnOpen">', start);
  return start >= 0 && end > start ? detailDialogsSource.slice(start, end) : "";
}

describe("DataGrid detail navigation index", () => {
  it("follows the supplied displayed order instead of deriving neighboring ids", () => {
    const displayedRows = [42, 7, 99];
    const currentRowIndex = displayedRows.indexOf(7);
    const previousRowIndex = adjacentDataGridDetailIndex(currentRowIndex, -1, displayedRows.length);
    const nextRowIndex = adjacentDataGridDetailIndex(currentRowIndex, 1, displayedRows.length);

    expect(displayedRows[previousRowIndex!]).toBe(42);
    expect(displayedRows[nextRowIndex!]).toBe(99);
    expect(displayedRows[previousRowIndex!]).not.toBe(6);
    expect(displayedRows[nextRowIndex!]).not.toBe(8);

    const visibleColumns = [5, 1, 3];
    const currentColumnPosition = visibleColumns.indexOf(1);
    expect(visibleColumns[adjacentDataGridDetailIndex(currentColumnPosition, -1, visibleColumns.length)!]).toBe(5);
    expect(visibleColumns[adjacentDataGridDetailIndex(currentColumnPosition, 1, visibleColumns.length)!]).toBe(3);
  });

  it("returns no-op indexes at every row and column boundary", () => {
    expect(adjacentDataGridDetailIndex(0, -1, 3)).toBeNull();
    expect(adjacentDataGridDetailIndex(2, 1, 3)).toBeNull();
    expect(adjacentDataGridDetailIndex(0, -1, 1)).toBeNull();
    expect(adjacentDataGridDetailIndex(0, 1, 1)).toBeNull();
    expect(adjacentDataGridDetailIndex(-1, 1, 3)).toBeNull();

    const visibleColumns = [5, 1, 3];
    expect(adjacentDataGridDetailIndex(visibleColumns.indexOf(5), -1, visibleColumns.length)).toBeNull();
    expect(adjacentDataGridDetailIndex(visibleColumns.indexOf(3), 1, visibleColumns.length)).toBeNull();
  });

  it("maps only the matching arrows to each detail axis", () => {
    expect(detailNavigationDelta("ArrowUp", "row")).toBe(-1);
    expect(detailNavigationDelta("ArrowDown", "row")).toBe(1);
    expect(detailNavigationDelta("ArrowLeft", "column")).toBe(-1);
    expect(detailNavigationDelta("ArrowRight", "column")).toBe(1);
    expect(detailNavigationDelta("ArrowLeft", "row")).toBeNull();
    expect(detailNavigationDelta("ArrowDown", "column")).toBeNull();
  });
});

describe("DataGrid detail keyboard safety", () => {
  it("ignores all arrows from inputs, textareas, contenteditable, and textbox targets", () => {
    for (const selectorPart of ["input", "textarea", "contenteditable", "textbox"]) {
      const target = targetMatching(selectorPart);
      for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
        expect(shouldIgnoreDataGridDetailNavigation(keyboardEvent({ key, target }))).toBe(true);
      }
    }
  });

  it("leaves nested overlays, modified arrows, and already-handled events alone", () => {
    const currentTarget = {} as EventTarget;
    const overlayTarget = targetMatching("popover-content");
    expect(shouldIgnoreDataGridDetailNavigation(keyboardEvent({ target: overlayTarget, currentTarget }))).toBe(true);
    expect(shouldIgnoreDataGridDetailNavigation(keyboardEvent({ shiftKey: true }))).toBe(true);
    expect(shouldIgnoreDataGridDetailNavigation(keyboardEvent({ ctrlKey: true }))).toBe(true);
    expect(shouldIgnoreDataGridDetailNavigation(keyboardEvent({ defaultPrevented: true }))).toBe(true);
  });

  it("wires row and column intents to the displayed DataGrid order", () => {
    expect(detailDialogsSource).toContain('@keydown="onRowDetailKeydown"');
    expect(detailDialogsSource).toContain('@keydown="onColumnDetailKeydown"');
    expect(detailDialogsSource).toContain("shouldIgnoreDataGridDetailNavigation(event)");
    expect(detailDialogsSource).toContain('detailNavigationDelta(event.key, "row")');
    expect(detailDialogsSource).toContain('detailNavigationDelta(event.key, "column")');
    expect(detailDialogsSource).toContain('emit("navigateRow", delta)');
    expect(detailDialogsSource).toContain('emit("navigateColumn", delta)');
    expect(dataGridSource).toContain('@navigate-row="navigateRowDetail"');
    expect(dataGridSource).toContain('@navigate-column="navigateColumnDetail"');

    const rowNavigation = functionBody(dataGridSource, "navigateRowDetail", "navigateColumnDetail");
    const columnNavigation = functionBody(dataGridSource, "navigateColumnDetail", "openContextRowDetailDialog");

    expect(rowNavigation).toContain("displayRowIndexById(rowDetailDialogRowId.value)");
    expect(rowNavigation).toContain("displayItemAt(nextRowIndex)");
    expect(rowNavigation).not.toMatch(/rowDetailDialogRowId\.value\s*[+-]/);
    expect(columnNavigation).toContain("visibleColumnIndexes.value.indexOf(columnDetailDialogColumnIndex.value)");
    expect(columnNavigation).toContain("visibleColumnIndexes.value[nextColumnPosition]");
    expect(columnNavigation).not.toMatch(/columnDetailDialogColumnIndex\.value\s*[+-]/);
  });

  it("keeps the dialog open while replacing the detail target and guards closed dialogs", () => {
    const rowNavigation = functionBody(dataGridSource, "navigateRowDetail", "navigateColumnDetail");
    const columnNavigation = functionBody(dataGridSource, "navigateColumnDetail", "openContextRowDetailDialog");

    expect(rowNavigation).toContain("if (!rowDetailDialogOpen.value || rowDetailDialogRowId.value === null) return;");
    expect(columnNavigation).toContain("if (!columnDetailDialogOpen.value || columnDetailDialogColumnIndex.value === null) return;");
    expect(rowNavigation).not.toContain("rowDetailDialogOpen.value = false");
    expect(columnNavigation).not.toContain("columnDetailDialogOpen.value = false");
    expect(detailDialogsSource).toContain('const rowSearch = ref("");');
    expect(detailDialogsSource).toContain('const columnSearch = ref("");');
  });

  it("focuses the dialog content on open so arrows work immediately", () => {
    expect(detailDialogsSource).toContain('@open-auto-focus="focusDetailDialogContentOnOpen"');
    expect(detailDialogsSource).toContain('tabindex="-1"');
    expect(detailDialogsSource).toContain("function focusDetailDialogContentOnOpen(event: Event) {");
  });
});

describe("DataGrid row detail list layout", () => {
  it("keeps the row-detail list to the two agreed columns", () => {
    const rowTable = rowDetailTableSource();
    expect(rowTable).not.toBe("");

    expect(rowTable.match(/<th\b/g)).toHaveLength(2);
    expect(rowTable).toContain('t("grid.columnName")');
    expect(rowTable).toContain('t("grid.cellValue")');
    // 序号、字段类型、长度/NULL 元信息、独立的复制列都不再出现在行详情里。
    expect(rowTable).not.toContain('t("grid.fieldIndex")');
    expect(rowTable).not.toContain("typeColorClass");
    expect(rowTable).not.toContain('t("grid.valueLength")');
    expect(rowTable).not.toContain('t("grid.nullValue")');
    expect(rowTable).not.toContain("tabular-nums");
  });

  it("keeps the value column borderless and drops the per-field copy button", () => {
    const rowTable = rowDetailTableSource();

    // 单字段复制按钮已去掉（复制整行仍走底部按钮）。
    expect(rowTable).not.toContain('@click="copyRowDetailFieldValue(field)"');
    expect(rowTable).not.toContain("group-hover/row-detail");
    // 值直接显示，不加边框/底色。
    expect(rowTable).not.toContain("border-input");
    expect(rowTable).not.toMatch(/class="dbx-data-grid-value-font[^"]*\bborder\b/);
    // 值列仍保留大值预览截断提示、格式化 JSON 与图片预览。
    expect(rowTable).toContain("field.rawValuePreview");
    expect(rowTable).toContain("field.formattedJson");
    expect(rowTable).toContain("field.imagePreviewUrl");
  });
});
