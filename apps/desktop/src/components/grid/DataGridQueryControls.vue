<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Filter, Trash2, X } from "@lucide/vue";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DataGridConditionEditor from "@/components/grid/DataGridConditionEditor.vue";
import DataGridFilterBuilder from "@/components/grid/DataGridFilterBuilder.vue";
import type { DataGridConditionColumnOption } from "@/composables/useDataGridConditionEditor";
import type { DataGridStructuredFilterRule } from "@/composables/useDataGridFilterBuilder";
import type { DataGridConditionHistoryScope } from "@/lib/dataGrid/dataGridConditionHistory";
import type { DataGridContextFilterMode } from "@/lib/dataGrid/dataGridSql";
import type { DataGridFilterEditorView } from "@/stores/settingsStore";

type LocalFilterSummary = {
  columnIndex: number;
  columnName: string;
  values: string[];
  hiddenValueCount: number;
};

const props = defineProps<{
  whereInput: string;
  columns: readonly string[];
  conditionColumns: readonly DataGridConditionColumnOption[];
  identifierQuote?: string;
  historyScope: DataGridConditionHistoryScope;
  canUseWhereSearch: boolean;
  compact: boolean;
  leadingBorder: boolean;
  filterBuilderOpen: boolean;
  filterEditorView: DataGridFilterEditorView;
  filterButtonActive: boolean;
  filterButtonCount: number;
  hasLocalColumnFilters: boolean;
  localFilterCount: number;
  localFilterSummaries: LocalFilterSummary[];
  rules: DataGridStructuredFilterRule[];
  filteredColumns: string[];
  modeOptions: Array<{ value: DataGridContextFilterMode; labelKey: string }>;
  columnSearch: string;
  applyOnlyBusy?: boolean;
  applyWhere: (value?: string) => void | boolean | Promise<void | boolean>;
}>();

const emit = defineEmits<{
  "update:whereInput": [value: string];
  "update:filterBuilderOpen": [value: boolean];
  "update:columnSearch": [value: string];
  ensureRule: [];
  addRule: [];
  applyOnly: [id: string];
  applyFilters: [];
  resetFilters: [];
  clearFilters: [];
  removeRule: [id: string];
  moveRule: [id: string, targetIndex: number];
  updateRule: [id: string, patch: Partial<DataGridStructuredFilterRule>];
  clearLocalFilter: [columnIndex?: number];
}>();

const { t } = useI18n();
const filterBuilderRef = ref<InstanceType<typeof DataGridFilterBuilder>>();
const pendingFirstEmptyRuleColumnSearch = ref(false);
let openingFirstEmptyRuleColumnSearch = false;

function updateRule(id: string, patch: Partial<DataGridStructuredFilterRule>) {
  emit("updateRule", id, patch);
}

function clearWhere() {
  emit("clearFilters");
}

async function openPendingFirstEmptyRuleColumnSearch() {
  if (openingFirstEmptyRuleColumnSearch || !pendingFirstEmptyRuleColumnSearch.value || !props.filterBuilderOpen || !filterBuilderRef.value) return;
  if (!props.rules.some((rule) => !rule.columnName && !rule.disabled)) return;
  openingFirstEmptyRuleColumnSearch = true;
  await nextTick();
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  try {
    if (!pendingFirstEmptyRuleColumnSearch.value || !props.filterBuilderOpen || !filterBuilderRef.value) return;
    pendingFirstEmptyRuleColumnSearch.value = false;
    await filterBuilderRef.value.openFirstEmptyRuleColumnSearch();
  } finally {
    openingFirstEmptyRuleColumnSearch = false;
  }
}

async function handleFilterButtonClick() {
  if (props.filterEditorView !== "quick") {
    const nextOpen = !props.filterBuilderOpen;
    emit("update:filterBuilderOpen", nextOpen);
    if (nextOpen) emit("ensureRule");
    return;
  }

  const shouldFocusColumnSearch = !props.filterBuilderOpen && props.rules.every((rule) => !rule.columnName);
  pendingFirstEmptyRuleColumnSearch.value = shouldFocusColumnSearch;
  emit("ensureRule");
  if (!shouldFocusColumnSearch) return;
  await nextTick();
  await openPendingFirstEmptyRuleColumnSearch();
}

watch([() => props.filterBuilderOpen, () => props.rules.map((rule) => `${rule.id}:${rule.columnName}:${rule.disabled ? "1" : "0"}`).join("\u0000"), filterBuilderRef], () => void openPendingFirstEmptyRuleColumnSearch(), { flush: "post" });
</script>

<template>
  <div data-grid-where-pill class="relative flex flex-1 min-w-0 items-center gap-1 rounded-md border border-border/70 bg-background px-1.5 py-0.5" :class="{ 'border-l': leadingBorder }">
    <template v-if="filterEditorView === 'quick'">
      <Popover :open="filterBuilderOpen" @update:open="emit('update:filterBuilderOpen', $event)">
        <PopoverTrigger as-child>
          <button
            type="button"
            data-grid-filter-button
            class="relative flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-medium transition-colors"
            :class="filterButtonActive ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
            :disabled="!canUseWhereSearch"
            :aria-label="t('grid.filter')"
            @click="handleFilterButtonClick"
          >
            <Filter class="h-3 w-3" />
            <span v-if="filterButtonCount" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none text-primary-foreground">{{ filterButtonCount }}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent data-filter-rules-scroll align="start" :collision-padding="8" class="max-h-[var(--reka-popover-content-available-height)] w-fit max-w-[calc(100vw-16px)] gap-2 overflow-y-auto overscroll-contain p-2.5">
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs font-medium text-foreground">{{ t("grid.filter") }}</div>
            <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" @click="emit('clearFilters')"><Trash2 class="mr-1 h-3.5 w-3.5" />{{ t("grid.clearFilter") }}</Button>
          </div>

          <div v-if="hasLocalColumnFilters" class="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2 text-xs font-medium text-primary">
                <Filter class="h-3.5 w-3.5 shrink-0" /><span class="truncate">{{ t("grid.localFiltersActive", { count: localFilterCount }) }}</span>
              </div>
              <Button variant="ghost" size="sm" class="h-6 shrink-0 px-2 text-xs" @click="emit('clearLocalFilter')"><X class="mr-1 h-3.5 w-3.5" />{{ t("grid.clearLocalFiltersShort") }}</Button>
            </div>
            <div class="space-y-0.5">
              <div v-for="summary in localFilterSummaries" :key="summary.columnIndex" class="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_auto] items-center gap-1.5 rounded border border-primary/10 bg-background/70 px-2 py-0.5 text-xs">
                <span class="truncate font-medium text-foreground" :title="summary.columnName">{{ summary.columnName }}</span>
                <span class="min-w-0 truncate font-mono text-muted-foreground">
                  <template v-for="(value, valueIndex) in summary.values" :key="valueIndex"
                    ><span v-if="valueIndex > 0">, </span><span>{{ value }}</span></template
                  >
                  <span v-if="summary.hiddenValueCount">{{ t("grid.localFilterMoreValues", { count: summary.hiddenValueCount }) }}</span>
                </span>
                <Button variant="ghost" size="icon" class="h-5 w-5 text-muted-foreground hover:text-destructive" :title="t('grid.clearFilter')" @click="emit('clearLocalFilter', summary.columnIndex)"><X class="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          <DataGridFilterBuilder
            ref="filterBuilderRef"
            :rules="rules"
            :show-apply-only="true"
            :apply-only-busy="applyOnlyBusy"
            :columns="[...columns]"
            :filtered-columns="filteredColumns"
            :mode-options="modeOptions"
            :column-search="columnSearch"
            :disabled="!canUseWhereSearch"
            :show-header="false"
            @add="emit('addRule')"
            @apply-only="emit('applyOnly', $event)"
            @apply="emit('applyFilters')"
            @reset="emit('resetFilters')"
            @clear="emit('clearFilters')"
            @remove="emit('removeRule', $event)"
            @move="(id, targetIndex) => emit('moveRule', id, targetIndex)"
            @update-rule="updateRule"
            @update:column-search="emit('update:columnSearch', $event)"
          />
        </PopoverContent>
      </Popover>
    </template>
    <button
      v-else
      type="button"
      data-grid-filter-button
      class="relative flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-medium transition-colors"
      :class="filterButtonActive ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'"
      :disabled="!canUseWhereSearch"
      :aria-label="t('grid.filter')"
      :aria-expanded="filterBuilderOpen"
      @click="handleFilterButtonClick"
    >
      <Filter class="h-3 w-3" />
      <span v-if="filterButtonCount" class="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none text-primary-foreground">{{ filterButtonCount }}</span>
    </button>
    <DataGridConditionEditor
      :model-value="whereInput"
      kind="where"
      :columns="conditionColumns"
      :identifier-quote="identifierQuote"
      :history-scope="historyScope"
      placeholder="WHERE"
      :history-empty-text="t('grid.conditionHistoryEmpty')"
      :history-no-matches-text="t('grid.conditionHistoryNoMatches')"
      :disabled="!canUseWhereSearch"
      :compact="compact"
      :apply="applyWhere"
      :clear="clearWhere"
      @update:model-value="emit('update:whereInput', $event)"
    />
  </div>
</template>
