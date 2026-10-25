// @vitest-environment happy-dom

import { createApp, h, nextTick, reactive, type App } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: { id: "rename-table", name: "Postgres", db_type: "postgres", driver_label: "PostgreSQL" },
  ensureConnected: vi.fn(),
  executeQuery: vi.fn(),
  buildRenameObjectSql: vi.fn(),
  prepareOracleTableRename: vi.fn(),
  executeOracleTableRename: vi.fn(),
  executeWithProductionSqlGuard: vi.fn(),
}));

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

vi.mock("@lucide/vue", async () => {
  const { defineComponent, h } = await import("vue");
  const Icon = defineComponent({ name: "Icon", setup: () => () => h("span") });
  return { Loader2: Icon };
});

vi.mock("@/components/ui/dialog", async () => {
  const { defineComponent, h } = await import("vue");
  const Div = defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { attrs, slots }) =>
      () =>
        h("div", attrs, slots.default?.()),
  });
  const Dialog = defineComponent({
    name: "Dialog",
    inheritAttrs: false,
    props: { open: { type: Boolean, default: false } },
    emits: ["update:open"],
    setup:
      (props, { attrs, slots }) =>
      () =>
        props.open ? h("div", { ...attrs, "data-dialog": "open" }, slots.default?.()) : null,
  });
  return { Dialog, DialogContent: Div, DialogHeader: Div, DialogTitle: Div, DialogFooter: Div };
});

vi.mock("@/components/ui/button", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    Button: defineComponent({
      name: "Button",
      inheritAttrs: false,
      props: { disabled: { type: Boolean, default: false } },
      setup:
        (props, { attrs, slots }) =>
        () =>
          h("button", { ...attrs, disabled: props.disabled }, slots.default?.()),
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

vi.mock("@/composables/useSqlHighlighter", () => ({ useSqlHighlighter: () => ({ highlight: (sql: string) => sql }) }));
vi.mock("@/stores/connectionStore", () => ({
  useConnectionStore: () => ({ getConfig: () => mocks.connection, ensureConnected: mocks.ensureConnected }),
}));
vi.mock("@/stores/settingsStore", () => ({ useSettingsStore: () => ({ editorSettings: { globalQueryTimeoutSecs: 30 } }) }));
vi.mock("@/lib/database/productionExecutionGuard", () => ({ executeWithProductionSqlGuard: mocks.executeWithProductionSqlGuard }));
vi.mock("@/lib/backend/api", () => ({ executeQuery: mocks.executeQuery }));
vi.mock("@/lib/table/objectRenameSql", () => ({ buildRenameObjectSql: mocks.buildRenameObjectSql }));
vi.mock("@/lib/table/oracleTableRename", () => ({
  prepareOracleTableRename: mocks.prepareOracleTableRename,
  executeOracleTableRename: mocks.executeOracleTableRename,
}));

import RenameTableDialog from "@/components/structure/RenameTableDialog.vue";

const mountedApps: App[] = [];

type RenamedPayload = { oldName: string; newName: string };

function mountDialog(options: { open?: boolean; databaseType?: string; tableName?: string } = {}) {
  const renamed: RenamedPayload[] = [];
  const openEvents: boolean[] = [];
  const state = reactive({
    open: options.open ?? true,
    connectionId: mocks.connection.id,
    database: "app",
    schema: "public",
    tableName: options.tableName ?? "users",
    databaseType: options.databaseType ?? "postgres",
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(RenameTableDialog, {
        ...state,
        "onUpdate:open": (open: boolean) => {
          openEvents.push(open);
          state.open = open;
        },
        onRenamed: (payload: RenamedPayload) => renamed.push(payload),
      }),
  });
  mountedApps.push(app);
  app.mount(host);
  return { host, state, renamed, openEvents };
}

/** Let watchers, promises and re-renders settle without advancing fake timers. */
async function flush() {
  for (let index = 0; index < 10; index++) {
    await nextTick();
    await Promise.resolve();
  }
}

function nameInput(host: HTMLElement): HTMLInputElement {
  const input = host.querySelector<HTMLInputElement>("[data-rename-table-input]");
  if (!input) throw new Error("Missing rename input");
  return input;
}

function confirmButton(host: HTMLElement): HTMLButtonElement {
  const button = host.querySelector<HTMLButtonElement>("[data-rename-table-confirm]");
  if (!button) throw new Error("Missing rename confirm button");
  return button;
}

function typeName(host: HTMLElement, value: string) {
  const input = nameInput(host);
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.ensureConnected.mockResolvedValue(undefined);
  mocks.executeQuery.mockResolvedValue({ columns: [], rows: [], affected_rows: 0, execution_time_ms: 1 });
  mocks.executeWithProductionSqlGuard.mockImplementation(async (options: { execute: () => Promise<unknown> }) => options.execute());
});

afterEach(() => {
  for (const app of mountedApps.splice(0)) app.unmount();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("RenameTableDialog", () => {
  it("prefills the current name and previews the debounced ALTER statement", async () => {
    mocks.buildRenameObjectSql.mockResolvedValue('ALTER TABLE "public"."users" RENAME TO "accounts"');
    const { host } = mountDialog();
    await flush();
    vi.clearAllTimers();

    expect(nameInput(host).value).toBe("users");
    expect(confirmButton(host).disabled).toBe(true);

    typeName(host, "accounts");
    await vi.advanceTimersByTimeAsync(299);
    expect(mocks.buildRenameObjectSql).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(mocks.buildRenameObjectSql).toHaveBeenCalledWith({ databaseType: "postgres", objectType: "TABLE", schema: "public", oldName: "users", newName: "accounts" });
    expect(host.querySelector("[data-rename-table-preview]")?.textContent).toContain('ALTER TABLE "public"."users" RENAME TO "accounts"');
    expect(confirmButton(host).disabled).toBe(false);
  });

  it("executes the preview through the production guard and reports the new name", async () => {
    mocks.buildRenameObjectSql.mockResolvedValue('ALTER TABLE "public"."users" RENAME TO "accounts"');
    const { host, renamed, openEvents } = mountDialog();
    await flush();
    vi.clearAllTimers();
    typeName(host, "accounts");
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    confirmButton(host).click();
    await flush();

    expect(mocks.ensureConnected).toHaveBeenCalledWith(mocks.connection.id);
    expect(mocks.executeWithProductionSqlGuard).toHaveBeenCalledTimes(1);
    expect(mocks.executeWithProductionSqlGuard.mock.calls[0]![0]).toMatchObject({
      connection: mocks.connection,
      database: "app",
      sql: 'ALTER TABLE "public"."users" RENAME TO "accounts"',
      source: "production.sourceStructure",
    });
    expect(mocks.executeQuery).toHaveBeenCalledWith(mocks.connection.id, "app", 'ALTER TABLE "public"."users" RENAME TO "accounts"', "public", undefined, { timeoutSecs: expect.any(Number) });
    expect(renamed).toEqual([{ oldName: "users", newName: "accounts" }]);
    expect(openEvents).toContain(false);
  });

  it("runs the Oracle prepare path and emits the plan's canonical name", async () => {
    const plan = {
      executable: true,
      statements: ['ALTER TABLE "ORDERS" RENAME TO "ORDERS_NEW"'],
      canonicalNewName: "ORDERS_NEW",
      dependents: [],
      issues: [],
    };
    mocks.prepareOracleTableRename.mockResolvedValue(plan);
    mocks.executeOracleTableRename.mockResolvedValue(undefined);
    const { host, renamed } = mountDialog({ databaseType: "oracle", tableName: "ORDERS" });
    await flush();
    vi.clearAllTimers();
    typeName(host, "orders_new");
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    expect(mocks.prepareOracleTableRename).toHaveBeenCalledWith({ connectionId: mocks.connection.id, database: "app", databaseType: "oracle", schema: "public", oldName: "ORDERS", newName: "orders_new" });
    expect(mocks.buildRenameObjectSql).not.toHaveBeenCalled();
    expect(host.querySelector("[data-rename-table-preview]")?.textContent).toContain("objects.tableRenameCoverage");
    expect(host.querySelector("[data-rename-table-preview]")?.textContent).toContain('RENAME TO "ORDERS_NEW"');

    confirmButton(host).click();
    await flush();
    expect(mocks.executeOracleTableRename).toHaveBeenCalledWith(plan, {}, expect.any(Function));
    expect(mocks.executeQuery).not.toHaveBeenCalled();
    expect(renamed).toEqual([{ oldName: "ORDERS", newName: "ORDERS_NEW" }]);
  });

  it("keeps confirm disabled while an Oracle plan still has unresolved issues", async () => {
    mocks.prepareOracleTableRename.mockResolvedValue({
      executable: false,
      statements: ['ALTER TABLE "ORDERS" RENAME TO "ORDERS_NEW"'],
      canonicalNewName: "ORDERS_NEW",
      dependents: [],
      issues: [{ code: "metadata_drift", message: "drifting", repairable: false }],
    });
    const { host } = mountDialog({ databaseType: "oracle", tableName: "ORDERS" });
    await flush();
    vi.clearAllTimers();
    typeName(host, "orders_new");
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    expect(host.querySelector("[data-rename-table-error]")?.textContent).toContain("objects.viewRenameValidationPending");
    expect(confirmButton(host).disabled).toBe(true);
  });

  it("keeps the dialog open when the production confirmation is declined", async () => {
    mocks.buildRenameObjectSql.mockResolvedValue('ALTER TABLE "public"."users" RENAME TO "accounts"');
    mocks.executeWithProductionSqlGuard.mockResolvedValue(undefined);
    const { host, renamed, openEvents } = mountDialog();
    await flush();
    vi.clearAllTimers();
    typeName(host, "accounts");
    await vi.advanceTimersByTimeAsync(300);
    await flush();

    confirmButton(host).click();
    await flush();

    expect(mocks.executeQuery).not.toHaveBeenCalled();
    expect(renamed).toEqual([]);
    expect(openEvents).not.toContain(false);
    expect(state_isOpen(openEvents)).toBe(true);
  });
});

/** The dialog only closes itself after a guarded execution succeeded. */
function state_isOpen(openEvents: boolean[]) {
  return openEvents.length === 0 || openEvents[openEvents.length - 1] !== false;
}
