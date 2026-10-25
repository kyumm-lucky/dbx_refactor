// @vitest-environment happy-dom
import { createApp, defineComponent, h, nextTick, type App } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the rename contract matters here: the structure editor stub raises the
// intent, the dialog stub reports the finished rename, and ContentArea has to
// keep the tab identity + the saved-contract refresh in sync.
const mocks = vi.hoisted(() => ({ refreshStructure: vi.fn(), toast: vi.fn() }));

vi.mock("@/components/grid/DataGrid.vue", () => ({
  __esModule: true,
  default: defineComponent({
    name: "DataGridStub",
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", { ...attrs, "data-data-grid": "" }, slots["topbar-leading"]?.({ compact: false })),
  }),
}));
vi.mock("@/components/structure/TableStructureEditor.vue", () => ({
  __esModule: true,
  default: defineComponent({
    name: "TableStructureEditorStub",
    inheritAttrs: false,
    props: { layout: { type: String, default: "tabs" }, tableName: { type: String, default: "" } },
    emits: ["requestRename", "saved", "update:draft"],
    setup(props, { attrs, emit, expose }) {
      expose({ refreshStructure: mocks.refreshStructure });
      return () => h("div", { ...attrs, "data-structure-view": "", "data-structure-table": props.tableName }, [h("button", { "data-stub-request-rename": "", onClick: () => emit("requestRename") }, "rename")]);
    },
  }),
}));
vi.mock("@/components/structure/RenameTableDialog.vue", () => ({
  __esModule: true,
  default: defineComponent({
    name: "RenameTableDialogStub",
    inheritAttrs: false,
    props: {
      open: { type: Boolean, default: false },
      tableName: { type: String, default: "" },
      schema: { type: String, default: undefined },
      databaseType: { type: String, default: undefined },
    },
    emits: ["update:open", "renamed"],
    setup(props, { attrs, emit }) {
      return () => h("div", { ...attrs, "data-rename-dialog": "", "data-open": String(props.open), "data-table": props.tableName }, [h("button", { "data-stub-confirm-rename": "", onClick: () => emit("renamed", { oldName: props.tableName, newName: "orders_renamed" }) }, "confirm")]);
    },
  }),
}));
vi.mock("@/components/editor/QueryEditor.vue", () => ({ default: { render: () => null } }));
vi.mock("@/composables/useToast", () => ({ useToast: () => ({ toast: mocks.toast }) }));

import ContentArea from "../ContentArea.vue";
import { useConnectionStore } from "@/stores/connectionStore";
import { useQueryStore } from "@/stores/queryStore";
import type { ConnectionConfig, QueryTab } from "@/types/database";

const cleanups: Array<() => void> = [];
const result = { columns: ["id"], rows: [], affected_rows: 0, execution_time_ms: 1 };

function connection(id: string, name: string): ConnectionConfig {
  return { id, name, db_type: "mysql", host: "localhost", port: 3306, username: "", password: "" };
}

function createTestPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useConnectionStore().connections = [connection("mysql", "Local MySQL")];
  return pinia;
}

function mountTab(pinia: ReturnType<typeof createTestPinia>, tab: QueryTab): { root: HTMLElement; tab: QueryTab; savedEvents: unknown[][]; app: App } {
  const connectionStore = useConnectionStore();
  const savedEvents: unknown[][] = [];
  const root = defineComponent({
    setup: () => () =>
      h(ContentArea, {
        activeTab: tab,
        activeConnection: connectionStore.getConfig("mysql"),
        activeOutputView: "result",
        executableSql: "",
        formatSqlRequest: null,
        compressSqlRequest: null,
        onStructureEditorSaved: (...args: unknown[]) => savedEvents.push(args),
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
  return { root: host, tab, savedEvents, app };
}

/** Both surfaces load through defineAsyncComponent, so wait for their import to settle. */
async function flushAsyncSurfaces() {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

function registerDataTab(): QueryTab {
  const queryStore = useQueryStore();
  const tabId = queryStore.createTab("mysql", "app", "public.users", "data", "public", undefined, undefined, { forceNew: true });
  queryStore.setTableMeta(tabId, {
    schema: "public",
    database: "app",
    tableName: "users",
    tableType: "TABLE",
    columns: [{ name: "id", data_type: "int", is_nullable: false, column_default: null, is_primary_key: true, extra: null }],
    primaryKeys: ["id"],
  });
  const tab = queryStore.tabs.find((candidate) => candidate.id === tabId)!;
  tab.result = result as QueryTab["result"];
  tab.structureDraft = { activeTab: "columns", newTableName: "", tableComment: "", originalTableComment: "", clean: true } as QueryTab["structureDraft"];
  return tab;
}

function registerStructureTab(): QueryTab {
  const queryStore = useQueryStore();
  const tabId = queryStore.openTableStructure("mysql", "app", "public", "users");
  return queryStore.tabs.find((candidate) => candidate.id === tabId)!;
}

describe("table structure rename flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  });

  it("updates the data tab identity and refreshes the structure view after a rename", async () => {
    const pinia = createTestPinia();
    const tab = registerDataTab();
    const { root, savedEvents } = mountTab(pinia, tab);
    await flushAsyncSurfaces();

    // The structure surface only mounts after the user visits that view.
    root.querySelectorAll<HTMLButtonElement>("[data-table-view-switcher] button")[1]?.click();
    await flushAsyncSurfaces();
    const structure = root.querySelector("[data-structure-view]");
    expect(structure?.getAttribute("data-structure-table")).toBe("users");

    root.querySelector<HTMLButtonElement>("[data-stub-request-rename]")!.click();
    await flushAsyncSurfaces();
    const dialog = root.querySelector("[data-rename-dialog]");
    expect(dialog?.getAttribute("data-open")).toBe("true");
    expect(dialog?.getAttribute("data-table")).toBe("users");

    root.querySelector<HTMLButtonElement>("[data-stub-confirm-rename]")!.click();
    await flushAsyncSurfaces();

    expect(tab.tableMeta?.tableName).toBe("orders_renamed");
    expect(tab.title).toBe("public.orders_renamed");
    expect(tab.structureDraft).toBeUndefined();
    expect(structure?.getAttribute("data-structure-table")).toBe("orders_renamed");
    expect(mocks.refreshStructure).toHaveBeenCalled();
    expect(savedEvents).toEqual([[tab.id, true]]);
    expect(mocks.toast).toHaveBeenCalledWith("contextMenu.renameObjectSuccess", 3000);
  });

  it("retargets a structure-mode tab and announces the saved-contract refresh", async () => {
    const pinia = createTestPinia();
    const tab = registerStructureTab();
    const { root, savedEvents } = mountTab(pinia, tab);
    await flushAsyncSurfaces();
    expect(root.querySelector("[data-structure-view]")).not.toBeNull();

    root.querySelector<HTMLButtonElement>("[data-stub-request-rename]")!.click();
    await flushAsyncSurfaces();
    expect(root.querySelector("[data-rename-dialog]")?.getAttribute("data-table")).toBe("users");

    root.querySelector<HTMLButtonElement>("[data-stub-confirm-rename]")!.click();
    await flushAsyncSurfaces();

    expect(tab.structureTableName).toBe("orders_renamed");
    expect(tab.title).toContain("structureEditor.editTabTitle");
    expect(savedEvents).toEqual([[tab.id, true]]);
  });
});
