<script setup lang="ts">
import { Download, Upload } from "@lucide/vue";
import { computed } from "vue";
import LightDropdown, { type LightDropdownItem } from "@/components/ui/LightDropdown.vue";

const props = withDefaults(
  defineProps<{
    items: LightDropdownItem[];
    label: string;
    onSelect: (value: string) => void;
    // 表数据页查询条使用 28px 纯图标入口：隐藏文字与 chevron，菜单项与选择行为不变
    iconOnly?: boolean;
  }>(),
  { iconOnly: false },
);

// 查询条入口按设计稿用下载图标；经典状态栏入口保持原有的上传图标
const triggerIcon = computed(() => (props.iconOnly ? Download : Upload));
const triggerClass = computed(() =>
  props.iconOnly
    ? "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    : "inline-flex h-6 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 text-foreground/80 hover:bg-accent hover:text-accent-foreground",
);
const triggerIconClass = computed(() => (props.iconOnly ? "h-[15px] w-[15px]" : "h-3.5 w-3.5"));
</script>

<template>
  <LightDropdown
    model-value=""
    :items="items"
    :aria-label="label"
    :trigger-title="iconOnly ? label : undefined"
    :trigger-icon="triggerIcon"
    :trigger-label="label"
    :trigger-class="triggerClass"
    :trigger-icon-class="triggerIconClass"
    :show-trigger-label="!iconOnly"
    :show-chevron="!iconOnly"
    :highlight-selected="false"
    check-position="none"
    align="end"
    @update:model-value="onSelect"
  />
</template>
