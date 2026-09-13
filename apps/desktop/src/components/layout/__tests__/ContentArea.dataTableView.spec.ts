// @vitest-environment happy-dom
import { createApp, defineComponent, h, nextTick, reactive, type App } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The data tab renders these two heavyweight surfaces; the assertions below are
// about which one ContentArea mounts and with which props, so both are stubbed.
vi.mock("@/components/grid/DataGrid.vue", () => ({
  // ContentArea loads the grid through defineAsyncComponent(() => import(...)),
  // which needs the ESM marker to pick `default` off the resolved module.
  __esModule: true,
  default: defineComponent({
    name: "DataGridStub",
    inheritAttrs: false,
    props: { tableInfoTab: { type: String, default: undefined }, autoShowTableInfo: { type: Boolean, default: undefined } },
    setup:
      (props, { attrs, slots }) =>
      () =>
        h(
          "div",
          { ...attrs, "data-data-grid": "", "data-table-info-tab": props.tableInfoTab, "data-auto-show-table-info": props.autoShowTableInfo },
          // 视图切换与「数据工具」在数据视图里由网格顶栏的 #topbar-leading 插槽承载，
          // 桩件要渲染它，断言才拿得到切换按钮（与线上结构一致）。
          slots["topbar-leading"]?.({ compact: false }),
        ),
  }),
}));
vi.mock("@/components/structure/TableStructureEditor.vue", () => ({
  __esModule: true,
  default: defineComponent({
    name: "TableStructureEditorStub",
    inheritAttrs: false,
    props: { layout: { type: String, default: "tabs" }, tableName: { type: String, default: "" } },
    setup:
      (props, { attrs }) =>
      () =>
        h("div", { ...attrs, "data-structure-view": "", "data-structure-layout": props.layout, "data-structure-table": props.tableName }),
  }),
}));
vi.mock("@/components/editor/QueryEditor.vue", () => ({ default: { render: () => null } }));

import ContentArea from "../ContentArea.vue";
import { useConnectionStore } from "@/stores/connectionStore";
import type { ConnectionConfig, QueryTab } from "@/types/database";

const cleanups: Array<() => void> = [];
const result = { columns: ["id"], rows: [], affected_rows: 0, execution_time_ms: 1 };

function dataTab(overrides: Partial<QueryTab> = {}): QueryTab {
  return {
    id: "table-tab",
    title: "public.users",
    connectionId: "mysql",
    database: "app",
    schema: "public",
    mode: "data",
    sql: "",
    isExecuting: false,
    result,
    tableMeta: { schema: "public", database: "app", tableName: "users", tableType: "TABLE", columns: [{ name: "id", data_type: "int", is_nullable: false, column_default: null, is_primary_key: true, extra: null }], primaryKeys: ["id"] },
    ...overrides,
  };
}

function connection(id: string, name: string): ConnectionConfig {
  return { id, name, db_type: "mysql", host: "localhost", port: 3306, username: "", password: "" };
}

function mountDataTab(initialTab: QueryTab): { root: HTMLElement; app: App; tab: QueryTab } {
  const pinia = createPinia();
  setActivePinia(pinia);
  const connectionStore = useConnectionStore();
  connectionStore.connections = [connection("mysql", "Local MySQL")];
  const state = reactive({ activeTab: initialTab });
  const root = defineComponent({
    setup: () => () =>
      h(ContentArea, {
        activeTab: state.activeTab as QueryTab,
        activeConnection: connectionStore.getConfig("mysql"),
        activeOutputView: "result",
        executableSql: "",
        formatSqlRequest: null,
        compressSqlRequest: null,
      } as never),
  });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp(root);
  app.use(pinia);
  app.use(createI18n({ legacy: false, locale: "en", messages: { en: {} } }));
  app.mount(host);
  cleanups.push(() => {
    app.unmount();
    host.remove();
  });
  return { root: host, app, tab: state.activeTab as QueryTab };
}

/** Both surfaces load through defineAsyncComponent, so wait for their import to settle. */
async function flushAsyncSurfaces() {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

function switcherButtons(root: HTMLElement): HTMLButtonElement[] {
  const switcher = root.querySelector<HTMLElement>("[data-table-view-switcher]");
  return switcher ? Array.from(switcher.querySelectorAll<HTMLButtonElement>("button")) : [];
}

describe("data tab view switcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  });

  it("opens on the structure view and keeps the row grid unmounted", async () => {
    const { root, tab } = mountDataTab(dataTab());
    await flushAsyncSurfaces();

    expect(root.querySelector("[data-structure-view]")).not.toBeNull();
    expect(root.querySelector('[data-structure-layout="rail"]')).not.toBeNull();
    // The row grid is heavy and stays unloaded until the user asks for it.
    expect(root.querySelector("[data-table-data-view]")).toBeNull();
    expect(tab.tableView).toBeUndefined();

    const [structureButton, dataButton] = switcherButtons(root);
    expect(structureButton?.getAttribute("aria-selected")).toBe("true");
    expect(dataButton?.getAttribute("aria-selected")).toBe("false");
  });

  it("switches to the row grid and remembers the choice on the tab", async () => {
    const { root, tab } = mountDataTab(dataTab());
    await flushAsyncSurfaces();

    switcherButtons(root)[1]?.click();
    await flushAsyncSurfaces();

    expect(tab.tableView).toBe("data");
    expect(root.querySelector("[data-data-grid]")).not.toBeNull();
    expect((root.querySelector("[data-table-data-view]") as HTMLElement).style.display).not.toBe("none");
    // The structure surface stays mounted but hidden, so switching back is instant.
    expect((root.querySelector("[data-table-structure-view]") as HTMLElement).style.display).toBe("none");
  });

  it("restores the data view for a tab that was left on it", async () => {
    const { root } = mountDataTab(dataTab({ tableView: "data" }));
    await flushAsyncSurfaces();

    expect(root.querySelector("[data-data-grid]")).not.toBeNull();
    expect(root.querySelector("[data-table-structure-view]")).toBeNull();
    expect(switcherButtons(root)[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("no longer wires the table-info drawer into the data tab", async () => {
    const { root } = mountDataTab(dataTab({ tableView: "data", tableInfoTab: "indexes" }));
    await flushAsyncSurfaces();

    const grid = root.querySelector<HTMLElement>("[data-data-grid]");
    expect(grid?.hasAttribute("data-table-info-tab")).toBe(false);
    expect(grid?.hasAttribute("data-auto-show-table-info")).toBe(false);
    expect(root.textContent).not.toContain("grid.tableInfo");
  });
});
