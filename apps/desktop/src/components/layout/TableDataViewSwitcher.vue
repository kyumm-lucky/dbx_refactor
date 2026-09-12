<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
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
  <div data-table-view-switcher class="flex shrink-0 items-center gap-1 px-1" role="tablist" :aria-label="t('tabs.tableStructure')">
    <Button
      size="sm"
      :variant="activeView === 'structure' ? 'secondary' : 'ghost'"
      class="h-5 shrink-0 px-2 text-xs leading-none"
      role="tab"
      :aria-selected="activeView === 'structure'"
      @click="selectView('structure')"
    >
      <span class="inline-flex h-4 items-center leading-none">{{ t("tabs.tableStructure") }}</span>
    </Button>
    <Button
      size="sm"
      :variant="activeView === 'data' ? 'secondary' : 'ghost'"
      class="h-5 shrink-0 px-2 text-xs leading-none"
      role="tab"
      :aria-selected="activeView === 'data'"
      @click="selectView('data')"
    >
      <span class="inline-flex h-4 items-center leading-none">{{ t("tabs.tableDataView") }}</span>
    </Button>
  </div>
</template>
