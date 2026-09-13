<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DataTableTabView } from "@/types/database";

const props = defineProps<{
  activeView: DataTableTabView;
}>();

const emit = defineEmits<{
  selectView: [view: DataTableTabView];
}>();

const { t } = useI18n();

function selectView(view: DataTableTabView) {
  if (props.activeView === view) return;
  emit("selectView", view);
}
</script>

<template>
  <!-- 分段控件：浅灰轨道 + 选中项白底小胶囊（macOS 分段控件样式），比两个独立按钮更省视觉重量。 -->
  <div data-table-view-switcher class="flex shrink-0 items-center gap-0.5 rounded-md bg-muted/70 p-0.5" role="tablist" :aria-label="t('tabs.tableStructure')">
    <button
      type="button"
      class="inline-flex h-4 shrink-0 items-center rounded px-2 text-xs leading-none transition-colors"
      :class="activeView === 'structure' ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
      role="tab"
      :aria-selected="activeView === 'structure'"
      @click="selectView('structure')"
    >
      <span class="inline-flex h-4 items-center leading-none">{{ t("tabs.tableStructure") }}</span>
    </button>
    <button
      type="button"
      class="inline-flex h-4 shrink-0 items-center rounded px-2 text-xs leading-none transition-colors"
      :class="activeView === 'data' ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
      role="tab"
      :aria-selected="activeView === 'data'"
      @click="selectView('data')"
    >
      <span class="inline-flex h-4 items-center leading-none">{{ t("tabs.tableDataView") }}</span>
    </button>
  </div>
</template>
