<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, ChevronsDown, ChevronsLeft, ChevronsRight, Loader2 } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LightDropdown, { type LightDropdownItem } from "@/components/ui/LightDropdown.vue";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_RESULT_PAGE_SIZE, MIN_RESULT_PAGE_SIZE } from "@/lib/dataGrid/paginationPageSize";
import DataGridExportMenu from "@/components/grid/DataGridExportMenu.vue";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    paginationEnabled?: boolean;
    selectionSummary: { cellCount: number; rowCount: number } | null;
    selectionSummarySumText: string;
    selectionSummaryAverageText: string;
    // 拖拽选区期间聚合值只是占位符，父组件把该状态传下来，值不可复制
    selectionSummaryPending?: boolean;
    loading: boolean;
    infiniteScrollEnabled: boolean;
    infiniteScrollAllLoaded: boolean;
    loadAllRowsActive: boolean;
    loadAllRowsEnabled: boolean;
    canLoadAllRows: boolean;
    canExport?: boolean;
    pageSize: number;
    defaultPageSize: number;
    pageSizeMenuItems: LightDropdownItem[];
    exportMenuItems: LightDropdownItem[];
    currentPage: number;
    maxPage?: number;
    canGoNextPage: boolean;
    canJumpLastPage: boolean;
    // 表数据页状态栏：只保留「页大小 chip + ‹ 页码 ›」，首/末页收进页大小菜单，不显示加载全部与导出
    compact?: boolean;
    // 经典状态栏可单独隐藏导出入口；compact 下导出已移到查询条，该值不再生效
    showExport?: boolean;
  }>(),
  { paginationEnabled: true, loadAllRowsActive: false, loadAllRowsEnabled: true, canLoadAllRows: false, canExport: true, selectionSummaryPending: false, compact: false, showExport: true },
);

const customPageSizeInput = defineModel<string>("customPageSizeInput", { default: "" });
const pageInput = ref(String(props.currentPage));
const maximumInputPage = computed(() => {
  const pageSize = Math.max(1, Math.trunc(props.pageSize));
  const maximumSafeOffsetPage = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(Number.MAX_SAFE_INTEGER / pageSize) + 1);
  if (typeof props.maxPage !== "number" || !Number.isFinite(props.maxPage) || props.maxPage < 1) return maximumSafeOffsetPage;
  return Math.min(maximumSafeOffsetPage, Math.floor(props.maxPage));
});

// compact 页大小 chip：24px 高、12px 字号、hover 走 accent 底色；classic 保持原有 20px 触发区
const pageSizeTriggerClass = computed(() =>
  props.compact
    ? "inline-flex h-6 shrink-0 items-center justify-center gap-[3px] whitespace-nowrap rounded-md px-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    : "inline-flex h-5 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-1.5 text-xs hover:bg-accent hover:text-accent-foreground",
);

const emit = defineEmits<{
  selectPageSize: [value: string];
  applyCustomPageSize: [];
  firstPage: [];
  previousPage: [];
  nextPage: [];
  jumpPage: [page: number];
  lastPage: [];
  loadAllRows: [];
  selectExport: [value: string];
  applyCustomPageSizeAndSetDefault: [];
  // 载荷是聚合值当前显示出来的文本，保证复制到的就是用户看到的那个数
  copySelectionSummary: [text: string];
}>();

// 拖拽选区中聚合值显示为占位符 "…"，此时不给复制入口，避免复制出一个假值
const selectionSummaryValueClass = computed(() => (props.selectionSummaryPending ? "" : "cursor-pointer transition-colors hover:text-foreground"));

function copySelectionSummaryValue(text: string) {
  if (props.selectionSummaryPending) return;
  emit("copySelectionSummary", text);
}

watch(
  () => props.currentPage,
  (page) => {
    pageInput.value = String(page);
  },
);
watch(
  () => props.loading,
  (loading, wasLoading) => {
    if (wasLoading && !loading) pageInput.value = String(props.currentPage);
  },
);

function applyPageInput() {
  const page = Number(pageInput.value);
  if (!Number.isSafeInteger(page) || page < 1) {
    pageInput.value = String(props.currentPage);
    return;
  }
  const targetPage = Math.min(page, maximumInputPage.value);
  pageInput.value = String(targetPage);
  if (targetPage !== props.currentPage) emit("jumpPage", targetPage);
}

function handlePageInputKeydown(event: KeyboardEvent) {
  event.stopPropagation();
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  applyPageInput();
}
</script>

<template>
  <div class="flex min-w-max items-center justify-end gap-1">
    <div v-if="selectionSummary" class="flex shrink-0 items-center gap-3 tabular-nums" :class="compact ? 'text-xs text-muted-foreground' : ''">
      <button type="button" class="shrink-0 text-left" :class="selectionSummaryValueClass" :title="selectionSummaryPending ? undefined : t('grid.copyValue')" :disabled="selectionSummaryPending" data-selection-summary-sum @click="copySelectionSummaryValue(selectionSummarySumText)">
        <span v-if="!selectionSummaryPending" class="sr-only">{{ t("grid.copyValue") }}: </span>{{ t("grid.selectionSum", { value: selectionSummarySumText }) }}
      </button>
      <button type="button" class="shrink-0 text-left" :class="selectionSummaryValueClass" :title="selectionSummaryPending ? undefined : t('grid.copyValue')" :disabled="selectionSummaryPending" data-selection-summary-average @click="copySelectionSummaryValue(selectionSummaryAverageText)">
        <span v-if="!selectionSummaryPending" class="sr-only">{{ t("grid.copyValue") }}: </span>{{ t("grid.selectionAverage", { value: selectionSummaryAverageText }) }}
      </button>
      <div class="flex shrink-0 items-center gap-1">
        <span class="shrink-0">{{ t("grid.selectionCells", { count: selectionSummary.cellCount }) }}</span>
        <span class="shrink-0">{{ t("grid.rows", { count: selectionSummary.rowCount }) }}</span>
      </div>
    </div>
    <Loader2 class="w-3 h-3 text-muted-foreground" :class="loading ? 'animate-spin' : 'invisible'" aria-hidden="true" />
    <template v-if="paginationEnabled && (infiniteScrollEnabled || loadAllRowsActive)">
      <span v-if="infiniteScrollAllLoaded" class="text-xs text-muted-foreground shrink-0">{{ t("grid.allLoaded") }}</span>
    </template>
    <template v-if="paginationEnabled && !infiniteScrollEnabled && !loadAllRowsActive">
      <LightDropdown
        :model-value="String(pageSize)"
        :items="pageSizeMenuItems"
        :trigger-label="`${pageSize}${t('grid.rowsPerPageShort')}`"
        :trigger-class="pageSizeTriggerClass"
        content-class="w-52"
        :highlight-selected="false"
        :check-position="compact ? 'left' : 'none'"
        align="end"
        @update:model-value="emit('selectPageSize', $event)"
      >
        <div class="bg-border -mx-1 my-1 h-px" />
        <div class="px-2 pt-2 text-xs font-medium text-foreground">{{ t("grid.customRowsPerPage") }}</div>
        <div class="px-2 pb-2 text-xs text-muted-foreground">{{ t("grid.currentAndDefaultPageSize", { current: pageSize, default: defaultPageSize }) }}</div>
        <div class="flex items-center gap-1.5 px-2 pb-2" @pointerdown.stop @click.stop @keydown.stop>
          <Input
            v-model="customPageSizeInput"
            type="number"
            inputmode="numeric"
            :min="MIN_RESULT_PAGE_SIZE"
            :max="MAX_RESULT_PAGE_SIZE"
            class="h-7 flex-1 px-2 text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            @keydown.enter.prevent.stop="emit('applyCustomPageSize')"
          />
          <Tooltip>
            <TooltipTrigger as-child
              ><Button variant="outline" size="icon" class="h-7 w-7 shrink-0" :aria-label="t('grid.applyForThisQuery')" @click.stop="emit('applyCustomPageSize')"><Check class="h-3.5 w-3.5" /></Button
            ></TooltipTrigger>
            <TooltipContent side="bottom">{{ t("grid.applyPageSize") }}</TooltipContent>
          </Tooltip>
        </div>
        <div class="flex gap-1.5 border-t px-2 py-2">
          <button type="button" class="flex-1 whitespace-nowrap rounded-md border px-2 py-1.5 text-center text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground" @click.stop="emit('applyCustomPageSize')">{{ t("grid.applyForThisQuery") }}</button>
          <button type="button" class="flex-1 whitespace-nowrap rounded-md bg-primary px-2 py-1.5 text-center text-xs text-primary-foreground hover:bg-primary/90" @click.stop="emit('applyCustomPageSizeAndSetDefault')">{{ t("grid.applyAndSetDefault") }}</button>
        </div>
        <!-- compact：状态栏不再单列首/末页按钮，改为页大小菜单底部的两个文字项 -->
        <template v-if="compact">
          <div class="bg-border -mx-1 my-1 h-px" />
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center rounded-md py-1 pr-1.5 pl-6 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            :disabled="loading || currentPage <= 1"
            @click.stop="emit('firstPage')"
          >
            {{ t("settings.shortcutGoToFirstPage") }}
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center rounded-md py-1 pr-1.5 pl-6 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            :disabled="loading || !canJumpLastPage"
            @click.stop="emit('lastPage')"
          >
            {{ t("settings.shortcutGoToLastPage") }}
          </button>
        </template>
      </LightDropdown>
      <!-- classic：保留首/末页与页码输入的完整导航，避免查询结果页与文档表格回归 -->
      <template v-if="!compact">
        <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0" :disabled="loading || currentPage <= 1" @click="emit('firstPage')"><ChevronsLeft class="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0" :disabled="loading || currentPage <= 1" @click="emit('previousPage')"><ChevronLeft class="h-3 w-3" /></Button>
        <Input
          v-model="pageInput"
          type="number"
          inputmode="numeric"
          :min="1"
          :max="maximumInputPage"
          :disabled="loading"
          :aria-label="t('grid.jumpToPage')"
          class="h-5 w-14 shrink-0 px-1 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          @keydown="handlePageInputKeydown"
        />
        <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0" :disabled="loading || !canGoNextPage" @click="emit('nextPage')"><ChevronRight class="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0" :disabled="loading || !canJumpLastPage" @click="emit('lastPage')"><ChevronsRight class="h-3 w-3" /></Button>
      </template>
      <!-- compact：仅 ‹ 页码 › 三个 24px 控件 -->
      <div v-else class="flex items-center gap-px">
        <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0 disabled:opacity-[0.35]" :aria-label="t('settings.shortcutGoToPreviousPage')" :disabled="loading || currentPage <= 1" @click="emit('previousPage')"><ChevronLeft class="h-3.5 w-3.5" /></Button>
        <Input
          v-model="pageInput"
          type="number"
          inputmode="numeric"
          :min="1"
          :max="maximumInputPage"
          :disabled="loading"
          :aria-label="t('grid.jumpToPage')"
          class="h-[22px] w-[34px] shrink-0 rounded-md border-border bg-background px-0 text-center text-xs tabular-nums focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/[0.16] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          @keydown="handlePageInputKeydown"
        />
        <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0 disabled:opacity-[0.35]" :aria-label="t('settings.shortcutGoToNextPage')" :disabled="loading || !canGoNextPage" @click="emit('nextPage')"><ChevronRight class="h-3.5 w-3.5" /></Button>
      </div>
    </template>
    <!-- compact 下「加载全部」已移除，仅 classic 状态栏保留 -->
    <Tooltip v-if="paginationEnabled && loadAllRowsEnabled && !compact">
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0" :disabled="loading || !canLoadAllRows" :aria-label="t('grid.loadAllAndGoToLastRow')" @click="emit('loadAllRows')">
          <ChevronsDown class="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{{ t("grid.loadAllAndGoToLastRow") }}</TooltipContent>
    </Tooltip>
    <!-- compact 下导出入口已移到查询条，状态栏不再渲染 -->
    <DataGridExportMenu v-if="canExport && showExport && !compact" :items="exportMenuItems" :label="t('grid.export')" :on-select="(value) => emit('selectExport', value)" />
  </div>
</template>
