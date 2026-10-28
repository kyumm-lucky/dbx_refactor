// @vitest-environment happy-dom

import { createApp, nextTick, type App } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TABLE_DDL = "CREATE TABLE `users` (\n  `id` bigint NOT NULL AUTO_INCREMENT,\n  `email` varchar(255) DEFAULT NULL,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB";

const mocks = vi.hoisted(() => ({
  connection: {
    id: "structure-ddl-tab",
    name: "MySQL",
    db_type: "mysql",
    driver_label: "MySQL",
  },
  ensureConnected: vi.fn(),
  executeQuery: vi.fn(),
  executeBatch: vi.fn(),
  listDataTypes: vi.fn(),
  buildTableStructureChangeSql: vi.fn(),
  buildMysqlAutoIncrementSql: vi.fn(),
  buildTableOwnerChangeSql: vi.fn(),
  getTablePartitionStatus: vi.fn(),
  getTableOwner: vi.fn(),
  updateEditorSettings: vi.fn(),
  loadObjectDdl: vi.fn(),
  invalidateObjectDdl: vi.fn(),
  loadObjectMetadataFacet: vi.fn(),
  invalidateObjectMetadataCache: vi.fn(),
  invalidateTableMetadataCache: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

vi.mock("@lucide/vue", async () => {
  const { defineComponent, h } = await import("vue");
  const Icon = defineComponent({ name: "Icon", setup: () => () => h("span") });
  return {
    AlertTriangle: Icon,
    Check: Icon,
    ChevronDown: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    ChevronUp: Icon,
    ClipboardList: Icon,
    Rows3: Icon,
    Copy: Icon,
    Database: Icon,
    Info: Icon,
    Keyboard: Icon,
    KeyRound: Icon,
    ListChevronsUpDown: Icon,
    ListTree: Icon,
    Link2: Icon,
    ShieldCheck: Icon,
    Code2: Icon,
    Loader2: Icon,
    Maximize2: Icon,
    Pencil: Icon,
    Plus: Icon,
    RefreshCw: Icon,
    RotateCcw: Icon,
    Save: Icon,
    Search: Icon,
    Settings: Icon,
    SlidersHorizontal: Icon,
    Trash2: Icon,
    UserRound: Icon,
    X: Icon,
  };
});

vi.mock("@/components/ui/button", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    Button: defineComponent({
      name: "Button",
      inheritAttrs: false,
      setup:
        (_props, { attrs, slots }) =>
        () =>
          h("button", attrs, slots.default?.()),
    }),
  };
});
vi.mock("@/components/ui/input", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    Input: defineComponent({
      name: "Input",
      inheritAttrs: false,
      props: { modelValue: { type: [String, Number], default: "" } },
      emits: ["update:modelValue"],
      setup:
        (props, { attrs, emit }) =>
        () =>
          h("input", {
            ...attrs,
            value: props.modelValue,
            onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLInputElement).value),
          }),
    }),
  };
});
vi.mock("@/components/ui/badge", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    Badge: defineComponent({
      name: "Badge",
      inheritAttrs: false,
      setup:
        (_props, { attrs, slots }) =>
        () =>
          h("span", attrs, slots.default?.()),
    }),
  };
});
// Tabs mock that reproduces the one detail this regression depends on: reka-ui's
// TabsContent renders its slot through Presence, and `usePresence` awaits a
// `nextTick` before dispatching MOUNT. So the pane (and every template ref
// inside it) mounts one tick *after* the tab became active. A mock that renders
// panes unconditionally — like the other structure specs use — cannot see the
// bug at all.
vi.mock("@/components/ui/tabs", async () => {
  const { computed, defineComponent, h, inject, nextTick, provide, ref, watch } = await import("vue");
  const TabsSelectKey = Symbol("tabs:select");
  const TabsActiveKey = Symbol("tabs:active");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  const Tabs = defineComponent({
    name: "MockTabs",
    inheritAttrs: false,
    props: { modelValue: { type: String, default: "" } },
    emits: ["update:modelValue"],
    setup: (props, { attrs, slots, emit }) => {
      provide(TabsSelectKey, (value: string) => emit("update:modelValue", value));
      provide(
        TabsActiveKey,
        computed(() => props.modelValue),
      );
      return () => h("div", attrs, slots.default?.());
    },
  });
  const TabsContent = defineComponent({
    name: "MockTabsContent",
    inheritAttrs: false,
    props: { value: { type: String, required: true } },
    setup: (props, { attrs, slots }) => {
      const active = inject<{ value: string }>(TabsActiveKey, ref(""));
      const selected = computed(() => active.value === props.value);
      const present = ref(selected.value);
      watch(selected, async (isSelected) => {
        if (!isSelected) {
          present.value = false;
          return;
        }
        await nextTick();
        present.value = true;
      });
      return () => h("div", attrs, present.value ? slots.default?.() : undefined);
    },
  });
  const TabsTrigger = defineComponent({
    name: "MockTabsTrigger",
    inheritAttrs: false,
    props: { value: { type: String, required: true } },
    setup: (props, { attrs, slots }) => {
      const select = inject<(value: string) => void>(TabsSelectKey, () => {});
      return () => h("button", { ...attrs, type: "button", "data-tab-trigger": props.value, onClick: () => select(props.value) }, slots.default?.());
    },
  });
  return { Tabs, TabsContent, TabsList: Div, TabsTrigger };
});
vi.mock("@/components/ui/dropdown-menu", async () => {
  const { defineComponent, h } = await import("vue");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  const Button = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("button", attrs, slots.default?.()),
  });
  return { DropdownMenu: Div, DropdownMenuCheckboxItem: Div, DropdownMenuContent: Div, DropdownMenuItem: Button, DropdownMenuTrigger: Div };
});
vi.mock("@/components/ui/popover", async () => {
  const { defineComponent, h } = await import("vue");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  return { Popover: Div, PopoverContent: Div, PopoverTrigger: Div };
});
vi.mock("@/components/ui/tooltip", async () => {
  const { defineComponent, h } = await import("vue");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  return { Tooltip: Div, TooltipContent: Div, TooltipTrigger: Div };
});
vi.mock("@/components/ui/searchable-select", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    SearchableSelect: defineComponent({
      name: "SearchableSelect",
      inheritAttrs: false,
      props: { modelValue: { type: String, default: "" } },
      emits: ["update:modelValue"],
      setup:
        (props, { attrs }) =>
        () =>
          h("button", { ...attrs, type: "button", "data-model-value": props.modelValue }),
    }),
  };
});
vi.mock("@/components/ui/select", async () => {
  const { defineComponent, h } = await import("vue");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  return { Select: Div, SelectContent: Div, SelectItem: Div, SelectTrigger: Div, SelectValue: Div };
});
vi.mock("@/components/editor/EditorSearchPanel.vue", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    default: defineComponent({
      name: "MockEditorSearchPanel",
      setup: () => ({ openSearch: () => false, closeSearch: () => false }),
      render: () => h("div", { "data-editor-search-panel": "true" }),
    }),
  };
});

vi.mock("@/stores/connectionStore", () => ({
  useConnectionStore: () => ({
    ensureConnected: mocks.ensureConnected,
    getConfig: (connectionId: string) => (connectionId === mocks.connection.id ? mocks.connection : undefined),
    connectionStateRevision: () => 0,
    isCurrentConnectionStateRevision: () => true,
    connectionIdentifierQuote: () => undefined,
  }),
}));
vi.mock("@/stores/productionSafetyStore", () => ({ useProductionSafetyStore: () => ({ requestConfirmation: vi.fn() }) }));
vi.mock("@/stores/queryStore", () => ({ useQueryStore: () => ({ tableStructureRefreshVersion: () => 0 }) }));
vi.mock("@/stores/historyStore", () => ({ useHistoryStore: () => ({ add: vi.fn() }) }));
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: () => ({
    editorSettings: { structureEditorDensity: "compact", sqlFormatter: {}, tableColumnTemplateFields: [], fontSize: 13, fontFamily: "monospace", theme: "default", generateSqlQuoteIdentifiers: true },
    updateEditorSettings: mocks.updateEditorSettings,
  }),
}));
vi.mock("@/composables/useTheme", () => ({ useTheme: () => ({ isDark: { value: false }, themePalette: { value: "pearl" } }) }));
vi.mock("@/composables/useToast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("@/lib/sql/sqlHighlighter", () => ({ createShikiSqlHighlighter: vi.fn(async () => (sql: string) => sql) }));
vi.mock("@/lib/sql/sqlFormatter", () => ({
  formatSqlForDisplay: vi.fn(async (sql: string) => sql),
  sqlFormatDialectForDbType: vi.fn(() => "mysql"),
}));
vi.mock("@/lib/editor/editorThemes", () => ({ loadEditorTheme: vi.fn(async () => []), editorFontTheme: vi.fn(() => []) }));
vi.mock("@/lib/metadata/objectDdlCache", () => ({
  loadObjectDdl: mocks.loadObjectDdl,
  invalidateObjectDdl: mocks.invalidateObjectDdl,
}));
vi.mock("@/lib/metadata/objectMetadataCache", () => ({ loadObjectMetadataFacet: mocks.loadObjectMetadataFacet, invalidateObjectMetadataCache: mocks.invalidateObjectMetadataCache }));
vi.mock("@/lib/metadata/tableMetadataCache", () => ({ invalidateTableMetadataCache: mocks.invalidateTableMetadataCache }));
vi.mock("@/lib/backend/api", () => ({
  executeQuery: mocks.executeQuery,
  executeBatch: mocks.executeBatch,
  listDataTypes: mocks.listDataTypes,
  buildTableStructureChangeSql: mocks.buildTableStructureChangeSql,
  buildMysqlAutoIncrementSql: mocks.buildMysqlAutoIncrementSql,
  buildTableOwnerChangeSql: mocks.buildTableOwnerChangeSql,
  getTablePartitionStatus: mocks.getTablePartitionStatus,
  getTableOwner: mocks.getTableOwner,
}));

import TableStructureEditor from "@/components/structure/TableStructureEditor.vue";

const mountedApps: App[] = [];

async function mountStructureEditor(props: Record<string, unknown> = {}) {
  const root = document.createElement("div");
  document.body.append(root);
  const app = createApp(TableStructureEditor, {
    connectionId: mocks.connection.id,
    database: "test",
    tableName: "users",
    ...props,
  });
  mountedApps.push(app);
  app.mount(root);
  await vi.waitFor(
    () => {
      expect(root.querySelector('[data-structure-rail], [data-tab-trigger="columns"]')).not.toBeNull();
      expect(root.textContent).toContain("structureEditor.noChanges");
    },
    { timeout: 3000 },
  );
  await settle();
  return root;
}

/** Let every already-queued load/preview microtask land before touching the DOM. */
async function settle() {
  for (let i = 0; i < 30; i++) {
    await nextTick();
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureConnected.mockResolvedValue(undefined);
  mocks.executeQuery.mockResolvedValue({ columns: [], rows: [] });
  mocks.executeBatch.mockResolvedValue({ rowsAffected: 0 });
  mocks.listDataTypes.mockResolvedValue([]);
  mocks.getTablePartitionStatus.mockResolvedValue({ isPartitionedParent: false, isPartition: false });
  mocks.getTableOwner.mockResolvedValue("");
  mocks.buildTableOwnerChangeSql.mockResolvedValue({ statements: [], warnings: [] });
  mocks.buildTableStructureChangeSql.mockResolvedValue({ statements: [], warnings: [] });
  mocks.loadObjectDdl.mockResolvedValue({ ddl: TABLE_DDL, cacheStatus: "remote" });
  mocks.loadObjectMetadataFacet.mockImplementation(async (_request: unknown, facet: string) => ({
    value:
      facet === "comment"
        ? ""
        : facet === "columns"
          ? [
              { name: "id", data_type: "bigint", nullable: false, default_value: null, comment: "" },
              { name: "email", data_type: "varchar(255)", nullable: true, default_value: null, comment: "" },
            ]
          : [],
    cacheStatus: "remote",
  }));
});

afterEach(() => {
  for (const app of mountedApps.splice(0)) app.unmount();
  document.body.innerHTML = "";
});

<<<<<<<< HEAD:apps/desktop/src/components/structure/__tests__/TableStructureEditor.railLayout.spec.ts
describe("TableStructureEditor rail layout", () => {
  it("renders the segmented viewbar instead of a vertical rail", async () => {
    const root = await mountStructureEditor({ layout: "rail" });
========
describe("TableStructureEditor column search", () => {
  it("finds a column by its comment without changing its name", async () => {
    const draft = draftWithColumns([{ name: "id", originalName: "id" }]);
    draft.columns[0].comment = "Approval Type";
    const root = await mountEditor(draft);
    const search = root.querySelector<HTMLInputElement>('input[placeholder="structureEditor.searchColumns"]')!;
    search.value = "approvaltype";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    expect(root.querySelector('button[title="structureEditor.nextColumnMatch"]')?.textContent?.trim()).toBe("1");
    expect(root.querySelector<HTMLInputElement>("[data-column-name-input]")?.value).toBe("id");
  });

  it.each(["pprovetype", "approveType", " APPROVETYPE ", "at", "approve_type"])("finds and navigates to an underscored column for %s", async (query) => {
    const root = await mountEditor(
      draftWithColumns([
        { name: "id", originalName: "id" },
        { name: "approve_type", originalName: "approve_type" },
      ]),
    );
    const search = root.querySelector<HTMLInputElement>('input[placeholder="structureEditor.searchColumns"]')!;
    search.value = query;
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();

    const nextMatch = root.querySelector<HTMLButtonElement>('button[title="structureEditor.nextColumnMatch"]')!;
    expect(nextMatch.textContent?.trim()).toBe("1");
    const matchedInput = Array.from(root.querySelectorAll<HTMLInputElement>("[data-column-name-input]")).find((input) => input.value === "approve_type")!;
    expect(matchedInput.closest("tr")?.classList.contains("structure-column-search-match")).toBe(true);
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(matchedInput.closest("tr")?.classList.contains("structure-column-search-current")).toBe(true);

    search.value = "missing";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(nextMatch.textContent?.trim()).toBe("0");
    expect(matchedInput.closest("tr")?.classList.contains("structure-column-search-match")).toBe(false);

    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(root.querySelector('button[title="structureEditor.nextColumnMatch"]')).toBeNull();
  });
});

describe("TableStructureEditor column name whitespace", () => {
  // MySQL rejects identifiers that end with a space (ERROR 1166 "Incorrect column
  // name"), so a pasted name carrying a trailing space produced an unexecutable
  // `ALTER TABLE ... CHANGE COLUMN ...` statement reported as "可执行".
  it("trims a user-entered trailing space before the name reaches the DDL builder", async () => {
    await mountEditor(draftWithColumns([{ name: "device_app_face_status ", originalName: "app_auth_status" }]));
>>>>>>>> e4246ab65 (fix(structure): support fuzzy column search in table editor (#13768)):apps/desktop/src/components/structure/__tests__/TableStructureEditor.columnFields.spec.ts

    expect(root.querySelector("[data-structure-rail]")).toBeNull();
    const triggers = [...root.querySelectorAll("[data-tab-trigger]")];
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers.some((trigger) => trigger.getAttribute("data-tab-trigger") === "columns")).toBe(true);
    // 对象头（表名/驱动/刷新）在两种布局下都保留
    expect(root.querySelector("[data-structure-header]")).not.toBeNull();
    expect(root.querySelector("[data-refresh-structure-shortcut]")).not.toBeNull();
  });

  it("keeps the SQL drawer and change bar inside the workspace", async () => {
    const root = await mountStructureEditor({ layout: "rail" });

    const preview = root.querySelector("[data-structure-sql-preview]");
    const changebar = root.querySelector("[data-structure-changebar]");
    expect(preview).not.toBeNull();
    expect(changebar).not.toBeNull();
    expect(root.querySelector("[data-structure-rail]")).toBeNull();
  });

  it("switches the visible section from the viewbar and swaps the section actions", async () => {
    const root = await mountStructureEditor({ layout: "rail" });

    const indexTrigger = root.querySelector<HTMLElement>('[data-tab-trigger="indexes"]');
    expect(indexTrigger).not.toBeNull();
    indexTrigger!.click();
    await settle();

    expect(root.textContent).toContain("structureEditor.addIndex");
    expect(root.textContent).not.toContain("structureEditor.addColumn");
  });

  it("keeps the standalone editor tabs when no layout is requested", async () => {
    const root = await mountStructureEditor({});

    expect(root.querySelector("[data-structure-rail]")).toBeNull();
    expect(root.querySelector('[data-tab-trigger="columns"]')).not.toBeNull();
    expect(root.textContent).toContain("structureEditor.density");
  });
});
