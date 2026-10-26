<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { DataTableTabView } from "@/types/database";

const props = defineProps<{
  activeView: DataTableTabView;
}>();

const emit = defineEmits<{
  selectView: [view: DataTableTabView];
}>();

const { t } = useI18n();

const isStructure = computed(() => props.activeView === "structure");

function selectView(view: DataTableTabView) {
  if (props.activeView === view) return;
  emit("selectView", view);
}
</script>

<template>
  <!-- macOS 分段控件：浅灰轨道 + 白底滑块，滑块随 activeView 平移（250ms Apple 缓动）。 -->
  <div data-table-view-switcher class="dbx-segmented" role="tablist" :aria-label="t('tabs.tableStructure')">
    <span aria-hidden="true" class="dbx-segmented__thumb" :class="{ 'dbx-segmented__thumb--right': isStructure }" />
    <button type="button" class="dbx-segmented__option" :class="{ 'is-active': !isStructure }" role="tab" :aria-selected="!isStructure" @click="selectView('data')">
      <span class="dbx-segmented__label">{{ t("tabs.tableDataView") }}</span>
    </button>
    <button type="button" class="dbx-segmented__option" :class="{ 'is-active': isStructure }" role="tab" :aria-selected="isStructure" @click="selectView('structure')">
      <span class="dbx-segmented__label">{{ t("tabs.tableStructure") }}</span>
    </button>
  </div>
</template>

<style scoped>
/* 28px macOS 分段控件：轨道 28、内边距 2、圆角 8，选中项为 24px 白底胶囊。 */
.dbx-segmented {
  position: relative;
  display: grid;
  flex: none;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  height: 28px;
  padding: 2px;
  border-radius: 8px;
  background: var(--dbx-segmented-track);
}

.dbx-segmented__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: 24px;
  border-radius: 6px;
  background: var(--background);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 12%),
    0 0 0 0.5px rgb(0 0 0 / 4%);
  transition: transform 250ms cubic-bezier(0.32, 0.72, 0, 1);
}

.dbx-segmented__thumb--right {
  transform: translateX(100%);
}

.dbx-segmented__option {
  position: relative;
  z-index: 1;
  height: 24px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--muted-foreground);
  font-size: 12.5px;
  line-height: 24px;
  white-space: nowrap;
  transition: color var(--dbx-dur-base, 180ms) ease;
}

.dbx-segmented__option:hover {
  color: var(--foreground);
}

.dbx-segmented__option.is-active {
  color: var(--foreground);
  font-weight: 500;
}

.dbx-segmented__label {
  display: inline-flex;
  height: 24px;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dbx-segmented__thumb {
    transition: none;
  }
}
</style>
