import { describe, expect, it } from "vitest";
import { DEFAULT_DATA_TABLE_VIEW, dataTableTabView } from "@/lib/tabs/dataTableView";

describe("dataTableTabView", () => {
  it("defaults to the table data view for a tab the user never switched", () => {
    expect(DEFAULT_DATA_TABLE_VIEW).toBe("data");
    expect(dataTableTabView({ mode: "data" })).toBe("data");
  });

  it("keeps an explicit structure choice remembered on the tab", () => {
    expect(dataTableTabView({ mode: "data", tableView: "structure" })).toBe("structure");
  });

  it("keeps an explicit data choice remembered on the tab", () => {
    expect(dataTableTabView({ mode: "data", tableView: "data" })).toBe("data");
  });

  it("always returns the data view for tabs whose mode is not data", () => {
    expect(dataTableTabView({ mode: "query" })).toBe("data");
    expect(dataTableTabView({ mode: "query", tableView: "structure" })).toBe("data");
  });
});
