import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../EditorGroupTabBar.vue", import.meta.url), "utf8");
const tabBarStyles = readFileSync(new URL("../appTabBar.css", import.meta.url), "utf8");
const toolbarSource = readFileSync(new URL("../AppToolbar.vue", import.meta.url), "utf8");
const editorGroupSource = readFileSync(new URL("../EditorGroup.vue", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../SqlEditorWorkspace.vue", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../../../App.vue", import.meta.url), "utf8");

function tabMenuItemsSource(): string {
  const start = source.indexOf("function getTabMenuItems");
  const end = source.indexOf("function handleTabDoubleClick");
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("EditorGroupTabBar compatibility with AppTabBar", () => {
  it("keeps data-tab double-click Zen mode behavior", () => {
    expect(source).toContain('"toggle-zen-mode": []');
    expect(source).toContain('tab.mode === "data"');
    expect(source).toContain('emit("toggle-zen-mode")');
    expect(source).toContain("if (tab.id !== props.activeTabId) {");
    expect(source).toContain("startRenameTab(tab);");
  });

  it("keeps the tab context menu to the six agreed entries with icons and no separators", () => {
    const menu = tabMenuItemsSource();

    expect(menu.match(/label:/g)).toHaveLength(6);
    // 短文案：完全按约定显示（完整标签标题/缩短标签标题、定位、关闭其他、关闭左侧所有、关闭右侧所有、全部关闭）。
    expect(menu).toContain('compactTabTitle.value ? t("contextMenu.tabMenuFullTitle") : t("contextMenu.tabMenuShortTitle")');
    expect(menu).toContain('t("contextMenu.tabMenuLocate")');
    expect(menu).toContain('t("contextMenu.tabMenuCloseOthers")');
    expect(menu).toContain('t("contextMenu.tabMenuCloseAllLeft")');
    expect(menu).toContain('t("contextMenu.tabMenuCloseAllRight")');
    expect(menu).toContain('t("contextMenu.tabMenuCloseAll")');
    expect(menu).not.toContain('t("sidebar.locateActiveTab")');
    // 每项都带图标（与“更多操作”菜单一致），但不再有分隔线。
    expect(menu.match(/icon:/g)).toHaveLength(6);
    expect(menu).not.toContain("separator");
    for (const removed of ["renameTab", "duplicateTab", "copyName", "splitRight", "splitDown", "pinTab", "closeTabGroup", "getTabPreferenceMenuItems"]) {
      expect(menu).not.toContain(removed);
    }
  });

  it("puts the new-query plus at the end of the tab strip and keeps it visible", () => {
    // 加号是常规分区（非固定行）末尾的元素，点击后由 App.vue 的 newQuery() 建标签。
    expect(source).toMatch(/<button v-if="!section\.pinned" type="button" class="tab-new-query-button"[\s\S]*?@click="emit\('new-query'\)"/);
    expect(source).toContain("data-new-query-tab");
    expect(source).toContain(':disabled="connectionStore.connections.length === 0"');
    // 标签横向溢出时吸附在滚动区右缘，保证永远可见。
    expect(tabBarStyles).toMatch(/\.app-tab-bar:not\(\.vertical-tab-layout\):not\(\.tab-wrap-mode\) \.tab-new-query-button \{[^}]*position:\s*sticky;[^}]*right:\s*0;/s);
    // 链路：标签栏 -> 编辑器分组 -> 工作区 -> App.vue。
    expect(editorGroupSource).toContain("@new-query=\"$emit('new-query')\"");
    expect(workspaceSource).toContain("@new-query=\"emit('new-query')\"");
    expect(appSource).toContain('@new-query="newQuery"');
    // 顶部工具栏不再重复放“新建查询”。
    expect(toolbarSource).not.toContain("toolbar.newQuery");
  });

  it("does not double-activate from the tab item click", () => {
    expect(source).toContain("function activateTab(tabId: string) {");
    expect(source).toContain('emit("activate-tab", tabId);');
    expect(source).not.toContain("queryStore.activateTabInGroup(props.groupId, tabId);");
  });

  it("cleans up drag listeners on cancel, blur, and unmount", () => {
    expect(source).toContain("function cleanupTabDrag(event?: Event)");
    expect(source).toContain('window.addEventListener("pointercancel", cleanupTabDrag)');
    expect(source).toContain('window.addEventListener("blur", cleanupTabDrag)');
    expect(source).toContain("onUnmounted(() => {");
    expect(source).toContain("cleanupTabDrag();");
  });

  it("validates drag source and target groups before moving", () => {
    expect(source).toContain("serializeTabDragPayload");
    expect(source).toContain("parseTabDragPayload");
    expect(source).toContain("const sourceGroupExists = queryStore.groups.some((group) => group.id === payload.sourceGroupId)");
    expect(source).toContain("const targetGroupExists = queryStore.groups.some((group) => group.id === targetGroupId)");
    expect(source).toContain("if (!sourceGroupExists || !targetGroupExists) {");
  });

  it("keeps pinned tabs in a separate row for horizontal placements", () => {
    expect(source).toContain('hasHorizontalFixedRows.value ? "horizontal-fixed-tabs" : ""');
    expect(source).toContain("horizontal-fixed-tabs-scroll");
    expect(source).toContain("const stripSections = computed(() =>");
    expect(source).toContain('{ key: "regular", pinned: false, entries: regularStripEntries.value }');
    expect(source).toContain('{ key: "fixed", pinned: true, entries: pinnedStripEntries.value }');
    expect(source).toContain("!isVerticalLayout.value && props.tabs.some((tab) => tab.pinned)");
  });
});
