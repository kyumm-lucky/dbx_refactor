<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Database, Download, Eye, Info, Loader2, Map, Plus, RefreshCcw, RotateCcw, Table2, Trash2, Upload } from "@lucide/vue";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TableDataViewSwitcher from "@/components/layout/TableDataViewSwitcher.vue";
import type { DataTableTabView } from "@/types/database";
import type { DataGridObjectBarCapabilities } from "@/lib/dataGrid/dataGridToolbar";

const props = defineProps<{
  title: string;
  driverLabel?: string;
  comment?: string;
  schemaLabel?: string;
  columnCount?: number;
  activeView: DataTableTabView;
  /** 网格未挂载（加载中 / 空 / 错误态）时为 undefined，此时只保留可用的刷新入口。 */
  capabilities?: Partial<DataGridObjectBarCapabilities>;
  canImport?: boolean;
}>();

const emit = defineEmits<{
  selectView: [view: DataTableTabView];
  refresh: [];
  generate: [];
  importData: [];
  exportData: [format: "csv" | "json" | "sql" | "xlsx"];
  tableInfo: [];
}>();

const { t } = useI18n();

const refreshSpinning = ref(false);
let refreshSpinTimer: number | undefined;

const refreshCapability = computed(() => props.capabilities?.refresh);
const addRowCapability = computed(() => props.capabilities?.addRow);
const deleteRowCapability = computed(() => props.capabilities?.deleteRow);
const saveCapability = computed(() => props.capabilities?.save);
const rollbackCapability = computed(() => props.capabilities?.rollback);
const previewCapability = computed(() => props.capabilities?.preview);
const layerPreviewCapability = computed(() => props.capabilities?.layerPreview);

const addRowVisible = computed(() => !!addRowCapability.value && addRowCapability.value.visible !== false);
const deleteRowVisible = computed(() => !!deleteRowCapability.value && deleteRowCapability.value.visible !== false);
const saveVisible = computed(() => !!saveCapability.value && saveCapability.value.visible !== false);
const rollbackVisible = computed(() => !!rollbackCapability.value && rollbackCapability.value.visible !== false);
const previewVisible = computed(() => !!previewCapability.value && previewCapability.value.visible !== false);
const layerPreviewVisible = computed(() => !!layerPreviewCapability.value && layerPreviewCapability.value.visible !== false);
const refreshDisabled = computed(() => !refreshCapability.value || refreshCapability.value.disabled === true);
const refreshLoading = computed(() => refreshCapability.value?.loading === true);
const deleteRowDisabled = computed(() => !deleteRowCapability.value || deleteRowCapability.value.disabled === true);
const addRowDisabled = computed(() => !addRowCapability.value || addRowCapability.value.disabled === true);
const saveDisabled = computed(() => !saveCapability.value || saveCapability.value.disabled === true);
const saveLoading = computed(() => saveCapability.value?.loading === true);
const pendingCount = computed(() => saveCapability.value?.pendingCount ?? 0);
const commitCountLabel = computed(() => (pendingCount.value > 99 ? "99+" : String(pendingCount.value)));
const commitLabel = computed(() => (saveLoading.value ? `${saveCapability.value?.label ?? t("grid.save")}…` : (saveCapability.value?.label ?? t("grid.save"))));
const metaParts = computed(() => {
  const parts = [props.comment?.trim(), props.schemaLabel?.trim(), props.columnCount ? t("gridSnapshot.columns", { count: props.columnCount }) : ""].filter((part): part is string => !!part);
  return parts;
});

const addRowMenuItems = computed(() => addRowCapability.value?.items ?? []);

function triggerRefresh() {
  if (refreshDisabled.value) return;
  const capability = refreshCapability.value;
  if (capability) {
    void capability.onTrigger();
  } else {
    emit("refresh");
  }
  if (refreshSpinTimer !== undefined) window.clearTimeout(refreshSpinTimer);
  refreshSpinning.value = false;
  void Promise.resolve().then(() => {
    refreshSpinning.value = true;
    refreshSpinTimer = window.setTimeout(() => {
      refreshSpinning.value = false;
      refreshSpinTimer = undefined;
    }, 620);
  });
}

function triggerAddRow() {
  if (addRowDisabled.value) return;
  void addRowCapability.value?.onTrigger();
}

function selectAddRowItem(value: string) {
  if (value === "insert-row") {
    triggerAddRow();
    return;
  }
  void addRowCapability.value?.onSelect(value);
}

function triggerDeleteRow() {
  if (deleteRowDisabled.value) return;
  void deleteRowCapability.value?.onTrigger();
}

function triggerCommit() {
  if (saveDisabled.value) return;
  void saveCapability.value?.onTrigger();
}

function triggerRollback() {
  if (!rollbackCapability.value || rollbackCapability.value.disabled) return;
  void rollbackCapability.value.onTrigger();
}

function triggerPreview() {
  if (!previewCapability.value || previewCapability.value.disabled || previewCapability.value.loading) return;
  void previewCapability.value.onTrigger();
}

function triggerLayerPreview() {
  if (!layerPreviewCapability.value || layerPreviewCapability.value.disabled) return;
  void layerPreviewCapability.value.onTrigger();
}

function triggerGenerate() {
  emit("generate");
}

function triggerImport() {
  emit("importData");
}

function triggerExport(format: "csv" | "json" | "sql" | "xlsx") {
  emit("exportData", format);
}

function triggerTableInfo() {
  emit("tableInfo");
}
</script>

<template>
  <header data-object-bar class="grid-object-bar" aria-label="表数据对象头">
    <div class="grid-object-icon" aria-hidden="true">
      <Table2 />
    </div>
    <div class="grid-object-text">
      <div class="grid-object-title-line">
        <h1 class="grid-object-title" data-object-title :title="title">{{ title }}</h1>
        <span v-if="driverLabel" class="grid-object-badge">{{ driverLabel }}</span>
      </div>
      <p v-if="metaParts.length" class="grid-object-meta">
        <template v-for="(part, index) in metaParts" :key="part">
          <span v-if="index > 0" class="grid-object-meta-dot" aria-hidden="true">·</span>
          <span>{{ part }}</span>
        </template>
      </p>
    </div>

    <div class="grid-object-actions">
      <TableDataViewSwitcher :active-view="activeView" @select-view="emit('selectView', $event)" />
      <span class="grid-object-sep" aria-hidden="true" />
      <button type="button" class="grid-object-icon-btn" :class="{ 'is-spinning': refreshSpinning || refreshLoading }" :disabled="refreshDisabled" :title="refreshCapability?.tooltip ?? t('grid.refresh')" :aria-label="t('grid.refresh')" data-object-refresh @click="triggerRefresh">
        <RefreshCcw />
      </button>
      <DropdownMenu v-if="addRowVisible">
        <DropdownMenuTrigger as-child>
          <button type="button" class="grid-object-icon-btn" :disabled="addRowDisabled" :title="addRowCapability?.tooltip ?? addRowCapability?.label" :aria-label="addRowCapability?.label" data-object-add-row>
            <Plus />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="min-w-52">
          <DropdownMenuItem @select="selectAddRowItem('insert-row')">{{ t("grid.addRow") }}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <template v-for="item in addRowMenuItems" :key="item.value">
            <DropdownMenuSeparator v-if="item.separatorBefore" />
            <DropdownMenuItem :disabled="item.disabled" @select="selectAddRowItem(item.value)">
              <span class="grid-object-menu-check">{{ item.selected ? "✓" : "" }}</span>
              <span class="flex-1">{{ item.label }}</span>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <button v-if="deleteRowVisible" type="button" class="grid-object-icon-btn grid-object-icon-btn--danger" :disabled="deleteRowDisabled" :title="deleteRowCapability?.tooltip ?? deleteRowCapability?.label" :aria-label="deleteRowCapability?.label" data-object-delete-row @click="triggerDeleteRow">
        <Trash2 />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button type="button" class="grid-object-icon-btn" :title="t('structureEditor.moreActions')" :aria-label="t('structureEditor.moreActions')" data-object-more>
            <span class="grid-object-more-dots" aria-hidden="true">⋯</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-60 min-w-56">
          <DropdownMenuItem data-object-table-info @select="triggerTableInfo">
            <Info class="grid-object-menu-icon" />
            {{ t("structureEditor.tableInfo") }}
          </DropdownMenuItem>
          <DropdownMenuItem v-if="previewVisible" :disabled="previewCapability?.disabled || previewCapability?.loading" data-object-preview @select="triggerPreview">
            <Eye class="grid-object-menu-icon" />
            {{ previewCapability?.label }}
          </DropdownMenuItem>
          <DropdownMenuItem v-if="layerPreviewVisible" :disabled="layerPreviewCapability?.disabled || layerPreviewCapability?.loading" data-object-layer-preview @select="triggerLayerPreview">
            <Map class="grid-object-menu-icon" />
            {{ layerPreviewCapability?.label }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-object-toolbox>
              <Database class="grid-object-menu-icon" />
              {{ t("tableToolbox.title") }}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem @select="triggerGenerate">
                  <Database class="grid-object-menu-icon" />
                  {{ t("tableToolbox.generateData") }}
                </DropdownMenuItem>
                <DropdownMenuItem v-if="canImport" @select="triggerImport">
                  <Download class="grid-object-menu-icon" />
                  {{ t("tableToolbox.importData") }}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Upload class="grid-object-menu-icon" />
                    {{ t("tableToolbox.exportData") }}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem @select="triggerExport('csv')">CSV</DropdownMenuItem>
                      <DropdownMenuItem @select="triggerExport('json')">JSON</DropdownMenuItem>
                      <DropdownMenuItem @select="triggerExport('sql')">SQL INSERT</DropdownMenuItem>
                      <DropdownMenuItem @select="triggerExport('xlsx')">XLSX</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <template v-if="rollbackVisible">
            <DropdownMenuSeparator />
            <DropdownMenuItem :disabled="rollbackCapability?.disabled || rollbackCapability?.loading" data-object-rollback @select="triggerRollback">
              <RotateCcw class="grid-object-menu-icon" />
              {{ rollbackCapability?.label }}
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <button v-if="saveVisible" type="button" class="grid-object-primary" :class="{ 'is-busy': saveLoading }" :disabled="saveDisabled" :title="saveCapability?.tooltip ?? saveCapability?.label" data-object-commit @click="triggerCommit">
        <Loader2 v-if="saveLoading" class="grid-object-primary-spinner" />
        <span>{{ commitLabel }}</span>
        <span v-if="pendingCount > 0" class="grid-object-count" data-object-commit-count>{{ commitCountLabel }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.grid-object-bar {
  display: flex;
  height: 52px;
  flex: none;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 14px;
  border-bottom: 1px solid var(--dbx-grid-hairline);
  /* 与设计稿一致：对象头是 chrome 层（亮 #f6f6f8 / 暗 #28282b），查询条才是内容层。 */
  background: var(--dbx-chrome);
  min-width: 0;
}

.grid-object-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(180deg, #4c9eff, #0071e3);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.35),
    0 1px 2px rgb(0 0 0 / 0.16);
  color: #fff;
}

.grid-object-icon svg {
  width: 17px;
  height: 17px;
  stroke-width: 1.9;
}

.grid-object-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.grid-object-title-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.grid-object-title {
  margin: 0;
  overflow: hidden;
  color: var(--foreground);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-object-badge {
  flex: none;
  padding: 0 5px;
  border: 1px solid var(--dbx-grid-hairline-strong);
  border-radius: 4px;
  color: var(--muted-foreground);
  font-size: 10.5px;
  font-weight: 450;
  line-height: 15px;
}

.grid-object-meta {
  display: flex;
  min-width: 0;
  margin: 0;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  color: var(--dbx-text-tertiary);
  font-size: 12.5px;
  white-space: nowrap;
}

.grid-object-meta-dot {
  color: var(--dbx-text-tertiary);
}

.grid-object-actions {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 3px;
  flex: none;
}

.grid-object-sep {
  width: 1px;
  height: 16px;
  flex: none;
  margin: 0 4px;
  background: var(--dbx-grid-hairline-strong);
}

.grid-object-icon-btn {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border-radius: 6px;
  color: var(--dbx-text-tertiary);
  transition:
    background var(--dbx-dur-fast, 120ms),
    color var(--dbx-dur-fast, 120ms),
    transform 80ms;
}

.grid-object-icon-btn svg {
  width: 15px;
  height: 15px;
}

.grid-object-icon-btn:hover:not(:disabled) {
  background: var(--accent);
  color: var(--foreground);
}

.grid-object-icon-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.grid-object-icon-btn:disabled {
  opacity: 0.3;
}

.grid-object-icon-btn--danger:hover:not(:disabled) {
  color: var(--destructive);
}

.grid-object-icon-btn.is-spinning svg {
  animation: grid-object-refresh-spin 620ms var(--dbx-ease-apple, cubic-bezier(0.32, 0.72, 0, 1));
}

.grid-object-more-dots {
  display: block;
  height: 15px;
  line-height: 13px;
  font-size: 17px;
  letter-spacing: 1px;
  transform: translateX(-0.5px);
}

.grid-object-primary {
  display: inline-flex;
  height: 28px;
  min-width: 74px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-left: 6px;
  padding: 0 12px;
  border-radius: 6px;
  background: var(--dbx-primary-solid);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background var(--dbx-dur-fast, 120ms),
    transform 80ms,
    opacity var(--dbx-dur-base, 180ms);
}

.grid-object-primary:hover:not(:disabled) {
  background: var(--dbx-primary-solid-hover);
}

.grid-object-primary:active:not(:disabled) {
  transform: scale(0.965);
}

.grid-object-primary:disabled {
  background: var(--dbx-fill-secondary);
  color: var(--dbx-text-tertiary);
}

.grid-object-primary.is-busy {
  opacity: 0.6;
}

.grid-object-primary-spinner {
  width: 13px;
  height: 13px;
  animation: grid-object-spinner 900ms linear infinite;
}

.grid-object-count {
  display: inline-grid;
  min-width: 15px;
  height: 15px;
  place-items: center;
  padding: 0 4px;
  border-radius: 8px;
  background: #fff;
  color: #0066cc;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.grid-object-menu-icon {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--muted-foreground);
}

.grid-object-menu-check {
  display: inline-block;
  width: 14px;
  flex: none;
  color: var(--primary);
  font-size: 12px;
  line-height: 1;
}

@keyframes grid-object-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes grid-object-spinner {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grid-object-icon-btn,
  .grid-object-primary {
    transition: none;
  }

  .grid-object-icon-btn.is-spinning svg,
  .grid-object-primary-spinner {
    animation: none;
  }
}
</style>
