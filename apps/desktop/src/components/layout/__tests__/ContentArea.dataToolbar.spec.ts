import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DATA_GRID_TOOLBAR_ACTION_COLLAPSE_ORDER } from "@/lib/dataGrid/dataGridToolbar";

const contentAreaSource = readFileSync(new URL("../ContentArea.vue", import.meta.url), "utf8");

describe("ContentArea data toolbar", () => {
  it("keeps the data-tab entries in the object header instead of an overflow menu", () => {
    // 表数据页改为「对象头 + 查询条」两层：视图切换、数据工具、刷新/新增行/删除行/提交
    // 都在 DataGridObjectBar，网格自身只保留查询条，不再有旧顶栏的 #topbar-leading。
    expect(contentAreaSource).toContain("<DataGridObjectBar");
    expect(contentAreaSource).not.toContain("<TableDataToolboxMenu");
    expect(contentAreaSource).not.toContain("#topbar-leading");
    expect(contentAreaSource).not.toContain("showDataTableInfoButton");
    expect(contentAreaSource).not.toContain("ToolbarOverflowMenu");
  });

  it("keeps table properties late in the grid toolbar collapse order", () => {
    // 表属性入口在网格自带工具条里（查询结果页仍用工具条）。折叠顺序从数组头部开始收，
    // 所以表属性必须排在靠后位置，窄宽度时先收起的是刷新/翻页这些。
    const index = DATA_GRID_TOOLBAR_ACTION_COLLAPSE_ORDER.indexOf("tableInfo");
    expect(index).toBeGreaterThanOrEqual(2);
  });
});
