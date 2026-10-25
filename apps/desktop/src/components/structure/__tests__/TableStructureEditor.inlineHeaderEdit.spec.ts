// @vitest-environment happy-dom

import { createApp, nextTick, type App } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TABLE_DDL = "CREATE TABLE `users` (\n  `id` bigint NOT NULL AUTO_INCREMENT,\n  `email` varchar(255) DEFAULT NULL,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB";

const mocks = vi.hoisted(() => ({
  connection: {
    id: "structure-rename-entry",
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

vi.mock("@/components/ui/tabs", async () => {
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
  return { Tabs: Div, TabsContent: Div, TabsList: Div, TabsTrigger: Button };
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
vi.mock("@/lib/sql/sqlFormatter", () => ({ formatSqlForDisplay: vi.fn(async (sql: string) => sql), sqlFormatDialectForDbType: vi.fn(() => "mysql") }));
vi.mock("@/lib/editor/editorThemes", () => ({ loadEditorTheme: vi.fn(async () => []), editorFontTheme: vi.fn(() => []) }));
vi.mock("@/lib/metadata/objectDdlCache", () => ({ loadObjectDdl: mocks.loadObjectDdl, invalidateObjectDdl: mocks.invalidateObjectDdl }));
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

/** Let every already-queued load microtask land before touching the DOM. */
async function settle() {
  for (let index = 0; index < 30; index++) {
    await nextTick();
    await Promise.resolve();
  }
}

async function mountEditor(databaseType: string, props: Record<string, unknown> = {}) {
  mocks.connection.db_type = databaseType;
  mocks.connection.name = databaseType;
  mocks.connection.driver_label = databaseType;
  const root = document.createElement("div");
  document.body.append(root);
  const app = createApp(TableStructureEditor, {
    connectionId: mocks.connection.id,
    database: "test",
    schema: "public",
    tableName: "users",
    ...props,
  });
  mountedApps.push(app);
  app.mount(root);
  await vi.waitFor(
    () => {
      expect(root.querySelector("[data-structure-identity-bar]")).not.toBeNull();
    },
    { timeout: 3000 },
  );
  await settle();
  return root;
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

function dispatchDblClick(element: Element) {
  element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
}

// The header Input emits its v-model update on the next microtask (useVModel
// with `passive`), so let it land before pressing Enter the way a user would.
async function typeInto(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
}

function pressKey(element: Element, key: string) {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

async function openInlineTitle(root: HTMLElement): Promise<HTMLInputElement> {
  const title = root.querySelector<HTMLElement>("[data-table-title]");
  expect(title).not.toBeNull();
  dispatchDblClick(title!);
  await settle();
  const input = root.querySelector<HTMLInputElement>("[data-table-title-input]");
  expect(input).not.toBeNull();
  return input!;
}

// The header is the only place the table identity can be edited, so both
// entries have to reach the same guard rails as the ⋯ menu: rename still goes
// through the owner's dialog (SQL preview + production guard), and the comment
// only ever changes the draft that the change bar applies.
describe("table structure header inline edit", () => {
  it("hands the name typed into the header to the owner's rename dialog", async () => {
    const onRequestRename = vi.fn();
    const root = await mountEditor("mysql", { onRequestRename });

    const input = await openInlineTitle(root);
    await typeInto(input, "users_renamed");
    pressKey(input, "Enter");
    await settle();

    expect(onRequestRename).toHaveBeenCalledTimes(1);
    expect(onRequestRename).toHaveBeenCalledWith("users_renamed");
    expect(root.querySelector("[data-table-title-input]")).toBeNull();
  });

  it("cancels the inline rename on Escape and never emits an unchanged name", async () => {
    const onRequestRename = vi.fn();
    const root = await mountEditor("mysql", { onRequestRename });

    let input = await openInlineTitle(root);
    await typeInto(input, "typo");
    pressKey(input, "Escape");
    await settle();

    expect(root.querySelector("[data-table-title-input]")).toBeNull();
    expect(root.querySelector("[data-table-title]")?.textContent).toContain("users");

    input = await openInlineTitle(root);
    await typeInto(input, "users");
    pressKey(input, "Enter");
    await settle();

    expect(onRequestRename).not.toHaveBeenCalled();
  });

  it("offers an inline entry for an empty table comment and marks the edit as pending", async () => {
    const root = await mountEditor("mysql");

    const addButton = root.querySelector<HTMLButtonElement>("[data-table-comment-add]");
    expect(addButton).not.toBeNull();
    addButton!.click();
    await settle();

    const input = root.querySelector<HTMLInputElement>("[data-table-comment-inline-input]");
    expect(input).not.toBeNull();
    await typeInto(input!, "客户主表");
    pressKey(input!, "Enter");
    await settle();

    const edited = root.querySelector("[data-table-comment-edit]");
    expect(edited?.textContent).toContain("客户主表");
    // Applying stays with the change bar; the header never writes on its own.
    const changebar = root.querySelector("[data-structure-changebar]")?.textContent ?? "";
    expect(changebar).toContain("structureEditor.pendingChangesCount");
    expect(changebar).not.toContain("structureEditor.upToDate");
  });

  it("drops the inline comment draft on Escape without touching the change bar", async () => {
    const root = await mountEditor("mysql");

    root.querySelector<HTMLButtonElement>("[data-table-comment-add]")!.click();
    await settle();

    const input = root.querySelector<HTMLInputElement>("[data-table-comment-inline-input]");
    expect(input).not.toBeNull();
    await typeInto(input!, "不会保存");
    pressKey(input!, "Escape");
    await settle();

    expect(root.querySelector("[data-table-comment-inline-input]")).toBeNull();
    expect(root.querySelector("[data-table-comment-add]")).not.toBeNull();
    expect(root.querySelector("[data-structure-changebar]")?.textContent).toContain("structureEditor.upToDate");
  });
});
