import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DATA_GRID_TOOLBAR_ACTION_COLLAPSE_ORDER } from "@/lib/dataGrid/dataGridToolbar";

const contentAreaSource = readFileSync(new URL("../ContentArea.vue", import.meta.url), "utf8");

describe("ContentArea data toolbar", () => {
  it("keeps the data-tab entries in the primary toolbar instead of an overflow menu", () => {
    // 本 fork 把数据标签页的视图切换与数据工具并入了网格顶栏（DataGrid 的
    // #topbar-leading），入口是 TableDataToolboxMenu，没有上游那套溢出菜单。
    expect(contentAreaSource).toContain("<TableDataToolboxMenu");
    expect(contentAreaSource).not.toContain("showDataTableInfoButton");
    expect(contentAreaSource).not.toContain("ToolbarOverflowMenu");
  });

  it("keeps table properties late in the grid toolbar collapse order", () => {
    // 表属性入口在网格自带工具条里。折叠顺序从数组头部开始收，所以表属性必须排在
    // 靠后位置，窄宽度时先收起的是刷新/翻页这些，不会把表属性先藏起来。
    const index = DATA_GRID_TOOLBAR_ACTION_COLLAPSE_ORDER.indexOf("tableInfo");
    expect(index).toBeGreaterThanOrEqual(2);
  });
});
