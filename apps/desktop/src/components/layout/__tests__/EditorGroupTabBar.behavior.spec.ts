// @vitest-environment happy-dom
import { createApp, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/CustomContextMenu.vue", () => ({
  default: {
    name: "CustomContextMenuStub",
    props: ["items"],
    template: `<div class="ctx-menu-stub" :data-menu-items="JSON.stringify(items.map((item) => ({ label: item.label, disabled: item.disabled === true, visible: item.visible })))"><slot /></div>`,
  },
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: { name: "TooltipStub", template: `<div><slot /></div>` },
  TooltipTrigger: { name: "TooltipTriggerStub", template: `<div><slot /></div>` },
  TooltipContent: { name: "TooltipContentStub", template: `<div><slot /></div>` },
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: { name: "PopoverStub", props: ["open"], template: `<div v-if="open"><slot /></div>` },
  PopoverContent: { name: "PopoverContentStub", template: `<div><slot /></div>` },
  PopoverTrigger: { name: "PopoverTriggerStub", template: `<div><slot /></div>` },
}));

vi.mock("@/components/connection/ReadOnlySessionControl.vue", () => ({
  default: { name: "ReadOnlySessionControlStub", template: `<span />` },
}));

vi.mock("@/components/layout/TabExecutionStatus.vue", () => ({
  default: { name: "TabExecutionStatusStub", template: `<span><slot /></span>` },
}));

vi.mock("@/components/icons/DatabaseIcon.vue", () => ({
  default: { name: "DatabaseIconStub", template: `<span />` },
}));

import EditorGroupTabBar from "../EditorGroupTabBar.vue";
import { useQueryStore } from "@/stores/queryStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useConnectionStore } from "@/stores/connectionStore";
import type { ConnectionConfig } from "@/types/database";

function createHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

interface Mounted {
  app: ReturnType<typeof createApp>;
  host: HTMLDivElement;
}

function mountBar(groupId: string, tabs: string[], activeTabId: string | null, activePinia: ReturnType<typeof createPinia>, onActivateTab?: (tabId: string) => void): Mounted {
  const store = useQueryStore();
  const host = createHost();
  const app = createApp(EditorGroupTabBar, {
    groupId,
    tabs: tabs.map((id) => store.tabs.find((candidate) => candidate.id === id)!),
    activeTabId,
    "onActivate-tab": onActivateTab,
  });
  // Reuse the active pinia so the component's internal store is the same
  // instance the test drives — otherwise drag validation runs against an
  // empty store and silently early-returns.
  app.use(activePinia);
  app.use(
    createI18n({
      legacy: false,
      locale: "en",
      messages: {
        en: {
          contextMenu: {
            splitRight: "Split right",
            splitDown: "Split down",
            changeOrientation: "Change orientation",
            unsplit: "Unsplit",
            renameTab: "Rename",
            duplicateTab: "Duplicate",
            copyName: "Copy name",
            closeTab: "Close",
            closeOtherTabs: "Close other tabs",
            closeLeftTabs: "Close left tabs",
            closeRightTabs: "Close right tabs",
            closeAllTabs: "Close all tabs",
            pinTab: "Pin",
            unpinTab: "Unpin",
            fullTabTitle: "Full title",
            compactTabTitle: "Compact title",
            tabMenuFullTitle: "Full title",
            tabMenuShortTitle: "Short title",
            tabMenuLocate: "Locate",
            tabMenuCloseOthers: "Close others",
            tabMenuCloseAllLeft: "Close all left",
            tabMenuCloseAllRight: "Close all right",
            tabMenuCloseAll: "Close all",
          },
          sidebar: { locateActiveTab: "Locate" },
          toolbar: { newQuery: "New query" },
        },
      },
    }),
  );
  app.mount(host);
  return { app, host };
}

async function settle() {
  await nextTick();
  await nextTick();
}

function tabPill(host: HTMLElement, tabId: string): HTMLElement {
  return host.querySelector<HTMLElement>(`[data-tab-id="${tabId}"]`)!;
}

function pointerDownOn(element: HTMLElement) {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    }),
  );
}

function pointerMoveTo(x: number, y: number) {
  window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 1, clientX: x, clientY: y, pointerId: 1 }));
}

function pointerUpAt(x: number, y: number) {
  window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, buttons: 1, clientX: x, clientY: y, pointerId: 1 }));
}

function fakeDropTarget(tabId: string, groupId: string): HTMLElement {
  const element = document.createElement("div");
  element.dataset.tabId = tabId;
  element.dataset.groupId = groupId;
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left: 0, right: 100, width: 100, top: 0, height: 30 } as DOMRect);
  return element;
}

describe("EditorGroupTabBar behavior", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it("activates a tab on plain click", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const activated: string[] = [];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia, (tabId) => activated.push(tabId));
    await settle();

    tabPill(host, secondId).click();
    await settle();

    expect(activated).toEqual([secondId]);

    app.unmount();
    host.remove();
  });

  it("suppresses the click that follows a drag, and only that click", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const activated: string[] = [];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia, (tabId) => activated.push(tabId));
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    pointerMoveTo(80, 60);
    pointerUpAt(80, 60);
    pill.click();
    await settle();

    // The drag consumed its own click; the tab must not be activated…
    expect(activated).toEqual([]);

    // …but a fresh, ordinary click still activates.
    pill.click();
    await settle();
    expect(activated).toEqual([secondId]);

    app.unmount();
    host.remove();
  });

  it("does not arm a drag when the primary button is not held", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    // macOS reports a trackpad tap as a mouse pointer with button=0 but buttons=0.
    tabPill(host, secondId).dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, buttons: 0, clientX: 10, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 0, clientX: 80, clientY: 60, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 80, clientY: 60, pointerId: 1 }));
    await settle();

    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).toContain(secondId);
    expect(document.body.style.cursor).toBe("");

    app.unmount();
    host.remove();
  });

  it("cancels a pending drag when the primary button is released before movement", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 0, clientX: 80, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 1, clientX: 90, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 90, clientY: 10, pointerId: 1 }));
    await settle();

    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).toContain(secondId);
    expect(document.body.style.cursor).toBe("");

    app.unmount();
    host.remove();
  });

  it("cancels an active drag when the primary button is no longer held", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    pointerMoveTo(80, 60);
    expect(document.body.style.cursor).toBe("grabbing");
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 0, clientX: 90, clientY: 60, pointerId: 1 }));
    await settle();

    expect(document.body.style.cursor).toBe("");
    expect(document.body.style.userSelect).toBe("");
    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).toContain(secondId);

    app.unmount();
    host.remove();
  });

  it("ignores movement from a different pointer", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    const pill = tabPill(host, secondId);
    pill.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, buttons: 1, clientX: 10, clientY: 10, pointerId: 7 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 1, clientX: 90, clientY: 10, pointerId: 8 }));
    await settle();

    expect(document.body.style.cursor).toBe("");
    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).toContain(secondId);
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 90, clientY: 10, pointerId: 7 }));

    app.unmount();
    host.remove();
  });

  it("clears completed-drag click suppression on a later trackpad tap", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const activated: string[] = [];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia, (tabId) => activated.push(tabId));
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(null);
    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    pointerMoveTo(80, 60);
    pointerUpAt(80, 60);

    // The completed drag left click suppression armed; a trackpad tap
    // (pointerdown with buttons=0) must consume it without arming a drag.
    pill.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, buttons: 0, clientX: 10, clientY: 10, pointerId: 1 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 0, clientX: 10, clientY: 12, pointerId: 1 }));
    pill.click();
    await settle();

    expect(activated).toEqual([secondId]);
    expect(document.body.style.cursor).toBe("");

    app.unmount();
    host.remove();
  });

  it("moves a dragged tab to the target group under the payload's source group", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    // Drag the second tab over the (virtual) right group's strip.
    vi.spyOn(document, "elementFromPoint").mockReturnValue(fakeDropTarget(firstId, "target-group"));

    // Seed a second group to receive the drop.
    store.groups = [mainGroup, { id: "target-group", tabIds: [], activeTabId: null }];
    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    pointerMoveTo(300, 10);
    pointerUpAt(300, 10);
    await settle();

    expect(store.groups.find((group) => group.id === "target-group")?.tabIds).toContain(secondId);
    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).not.toContain(secondId);

    app.unmount();
    host.remove();
  });

  it("ignores a drop when the tab's current owner no longer matches the payload", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    vi.spyOn(document, "elementFromPoint").mockReturnValue(fakeDropTarget(firstId, "target-group"));
    store.groups = [mainGroup, { id: "target-group", tabIds: [], activeTabId: null }];

    const pill = tabPill(host, secondId);
    pointerDownOn(pill);
    // While the button is held, the tab is relocated behind the drag's back —
    // the stale payload no longer matches the current owner.
    store.moveTabToGroup(secondId, "target-group");
    pointerMoveTo(300, 10);
    pointerUpAt(300, 10);
    await settle();

    // Only the intervening store move happened; the drop itself was rejected.
    expect(store.groups.find((group) => group.id === "target-group")?.tabIds).toEqual([secondId]);
    expect(store.groups.find((group) => group.id === mainGroup.id)?.tabIds).toEqual([firstId]);

    app.unmount();
    host.remove();
  });

  it("offers close-all-left between close-others and close-all-right, disabled when nothing is to the left", async () => {
    const store = useQueryStore();
    // The user-visible default state is the shortened tab title, so the toggle
    // offers the full title.
    useSettingsStore().updateEditorSettings({ compactTabTitle: true });
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");

    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    // One stub per tab; the stub wraps the tab pill, so scope by ancestor.
    // The stub only serializes label/disabled/visible — the closing behavior
    // itself is covered by queryStore.groups.spec.
    const menuFor = (tabId: string) => {
      const pill = tabPill(host, tabId);
      const stub = pill.closest<HTMLElement>(".ctx-menu-stub");
      return JSON.parse(stub!.dataset.menuItems ?? "[]");
    };
    const labels = (tabId: string) => menuFor(tabId).map((item: { label: string }) => item.label);

    // First tab: nothing to its left — the action exists but is disabled.
    expect(menuFor(firstId).find((item: { label: string }) => item.label === "Close all left")).toMatchObject({ disabled: true });
    const order = labels(firstId);
    expect(order.indexOf("Close all left")).toBeGreaterThan(order.indexOf("Close others"));
    expect(order.indexOf("Close all left")).toBeLessThan(order.indexOf("Close all right"));
    // Exactly the six agreed entries — no extra rows and no separators.
    expect(order).toEqual(["Full title", "Locate", "Close others", "Close all left", "Close all right", "Close all"]);

    // Second tab: a tab exists to its left — the action becomes enabled.
    expect(menuFor(secondId).find((item: { label: string }) => item.label === "Close all left")).toMatchObject({ disabled: false });

    app.unmount();
    host.remove();
  });

  it("creates a query tab from the trailing plus, which disables without connections", async () => {
    const store = useQueryStore();
    const connectionStore = useConnectionStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const mainGroup = store.groups[0];
    const created: number[] = [];
    const host = createHost();
    const app = createApp(EditorGroupTabBar, {
      groupId: mainGroup.id,
      tabs: [store.tabs.find((tab) => tab.id === firstId)!],
      activeTabId: firstId,
      "onNew-query": () => created.push(1),
    });
    app.use(pinia);
    app.use(
      createI18n({
        legacy: false,
        locale: "en",
        messages: { en: { toolbar: { newQuery: "New query" } } },
      }),
    );
    app.mount(host);
    await settle();

    const plus = host.querySelector<HTMLButtonElement>("[data-new-query-tab]");
    expect(plus).not.toBeNull();
    // 没有连接时“新建查询”不可用：加号仍在最右侧，但置灰。
    expect(plus!.disabled).toBe(true);
    plus!.click();
    await settle();
    expect(created).toHaveLength(0);

    connectionStore.connections = [{ id: "pg-1", name: "PG 1", db_type: "postgres", driver_profile: "postgres", host: "127.0.0.1", port: 5432, color: "" } as ConnectionConfig];
    await settle();
    const enabled = host.querySelector<HTMLButtonElement>("[data-new-query-tab]")!;
    expect(enabled.disabled).toBe(false);
    enabled.click();
    await settle();
    expect(created).toHaveLength(1);

    app.unmount();
    host.remove();
  });

  it("flushes pending grid edits via before-tab-switch before activating another tab", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    const events: Array<CustomEvent | Event> = [];
    const listener = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener("dbx:before-tab-switch", listener);
    // The legacy bar flushed pending edits on pointerdown, before activation.
    pointerDownOn(tabPill(host, secondId));
    tabPill(host, secondId).click();
    await settle();
    window.removeEventListener("dbx:before-tab-switch", listener);

    expect(events).toHaveLength(1);
    expect((events[0] as CustomEvent).detail).toEqual({ tabId: secondId, fromTabId: firstId });

    app.unmount();
    host.remove();
  });

  it("dims the dragged pill and shows the insertion indicator on the hovered pill", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    const fake = fakeDropTarget(secondId, mainGroup.id);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(fake);

    const sourcePill = tabPill(host, firstId);
    const targetPill = tabPill(host, secondId);
    pointerDownOn(sourcePill);
    pointerMoveTo(300, 10);
    await settle();

    // Dragged pill dims; hovered pill shows the after-insertion ring line.
    expect(sourcePill.style.opacity).toBe("0.4");
    expect(targetPill.style.boxShadow).toBe("inset -3px 0 0 0 var(--ring)");

    // Crossing the pill's midpoint flips the indicator to "before".
    vi.spyOn(fake, "getBoundingClientRect").mockReturnValue({ left: 0, right: 600, width: 600, top: 0, height: 30 } as DOMRect);
    pointerMoveTo(20, 10);
    await settle();
    expect(targetPill.style.boxShadow).toBe("inset 3px 0 0 0 var(--ring)");

    // Dropping clears every drag visual.
    pointerUpAt(20, 10);
    await settle();
    expect(sourcePill.style.opacity).toBe("");
    expect(targetPill.style.boxShadow).toBe("");

    app.unmount();
    host.remove();
  });

  it("does not arm the drag for touch input", async () => {
    const store = useQueryStore();
    const firstId = store.createTab("pg-1", "app", "Query 1", "query");
    const secondId = store.createTab("pg-1", "app", "Query 2", "query");
    const mainGroup = store.groups[0];
    const { app, host } = mountBar(mainGroup.id, [firstId, secondId], firstId, pinia);
    await settle();

    const sourcePill = tabPill(host, firstId);
    sourcePill.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10, pointerType: "touch" }));
    pointerMoveTo(300, 10);
    await settle();

    expect(sourcePill.style.opacity).toBe("");

    app.unmount();
    host.remove();
  });
});
