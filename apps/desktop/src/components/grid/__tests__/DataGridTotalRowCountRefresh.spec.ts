// @vitest-environment happy-dom

import { createApp, defineComponent, h, markRaw, nextTick, reactive, type App } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { QueryResult } from "@/types/database";

vi.mock("@/composables/useDataGridColumnResize", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/composables/useDataGridColumnResize")>();
  const { ref } = await import("vue");
  return {
    ...actual,
    useDataGridColumnResize: () => ({
      initColumnWidths: vi.fn(),
      onResizeStart: vi.fn(),
      autoFitColumn: vi.fn(),
      renderedColumnWidths: ref([120]),
      totalWidth: ref(120),
      columnVars: ref({ "--total-w": "120px" }),
      getIsResizing: () => false,
    }),
  };
});

import DataGrid from "../DataGrid.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const mountedApps: Array<{ app: App; host: HTMLElement }> = [];

function pageResult(): QueryResult {
  return markRaw({ columns: ["id"], rows: Array.from({ length: 100 }, (_, i) => [i + 1]), affected_rows: 100, execution_time_ms: 1, has_more: true });
}

function mountGrid(countTotalRows = vi.fn<() => Promise<number | undefined>>().mockResolvedValue(250), options: { context?: "results" | "table-data"; withoutQueryCount?: boolean } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useSettingsStore().updateEditorSettings({ dataGridRenderMode: "canvas", infiniteScroll: false });
  const state = reactive({ result: pageResult(), pageOffset: 0, loading: false, totalRowCount: undefined as number | undefined, countSql: options.withoutQueryCount ? "" : "SELECT COUNT(*) FROM users WHERE active = 1" });
  const onReload = vi.fn(async () => {
    state.loading = true;
    await nextTick();
    state.result = pageResult();
    state.loading = false;
  });
  const onPaginate = vi.fn();
  const Root = defineComponent({
    setup: () => () =>
      h(
        TooltipProvider,
        { delayDuration: 0 },
        {
          default: () =>
            h(DataGrid, {
              ...state,
              pageLimit: 100,
              context: options.context ?? "table-data",
              databaseType: "mysql",
              connectionId: "test",
              database: "db",
              tableMeta: { tableName: "users", schema: "db", columns: [], primaryKeys: [] },
              paginationEnabled: true,
              countTotalRows: options.withoutQueryCount ? undefined : countTotalRows,
              onReload,
              onPaginate,
            }),
        },
      ),
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp(Root);
  app.use(pinia);
  app.use(i18n);
  app.mount(host);
  mountedApps.push({ app, host });
  return { host, state, countTotalRows, onReload, onPaginate };
}

async function settle() {
  for (let i = 0; i < 4; i++) {
    await nextTick();
    await Promise.resolve();
  }
}

function clickButton(host: HTMLElement, label: string) {
  const button = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find((item) => item.getAttribute("aria-label") === label || item.textContent?.trim() === label);
  if (!button) throw new Error(`Button missing: ${label}`);
  button.click();
}

function totalText(host: HTMLElement) {
  return host.textContent ?? "";
}

afterEach(() => {
  for (const { app, host } of mountedApps.splice(0)) {
    app.unmount();
    host.remove();
  }
  vi.restoreAllMocks();
});

describe("DataGrid manual count freshness", () => {
  it("keeps query-specific counting available for editable query results", async () => {
    const { host, countTotalRows } = mountGrid(undefined, { context: "results" });
    await settle();
    clickButton(host, String(i18n.global.t("grid.calculateTotalRowsInline")));
    await settle();
    expect(countTotalRows).toHaveBeenCalledOnce();
    expect(totalText(host)).toContain("250");
  });

  it("keeps the count while paging through the same result", async () => {
    const { host, state } = mountGrid();
    await settle();
    clickButton(host, String(i18n.global.t("grid.calculateTotalRowsInline")));
    await settle();
    state.pageOffset = 100;
    state.result = pageResult();
    await settle();
    expect(totalText(host)).toContain("250");
  });
});
