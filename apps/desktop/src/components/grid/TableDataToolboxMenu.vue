<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Database, Download, Toolbox, Upload } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const props = defineProps<{
  /** 窄宽度时只留图标（与其它工具条控件一致的收起行为）。 */
  compact?: boolean;
  /** 导入入口必须跟库能力走：不支持导入的库（如 HANA）不显示该项，否则向导会停在「选项」步。 */
  canImport: boolean;
}>();

const emit = defineEmits<{
  generate: [];
  importData: [];
  exportData: [format: "csv" | "json" | "sql" | "xlsx"];
}>();

const { t } = useI18n();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="h-5 text-xs px-1.5 shrink-0" :title="t('tableToolbox.title')"
        ><Toolbox class="h-3.5 w-3.5" /><span v-if="!props.compact">{{ t("tableToolbox.title") }}</span></Button
      >
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-max min-w-44 gap-0 overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-xl">
      <div class="border-b bg-muted/40 px-3 py-2">
        <div class="text-xs font-semibold">{{ t("tableToolbox.title") }}</div>
      </div>
      <div class="p-1">
        <DropdownMenuItem class="gap-2" @click="emit('generate')">
          <Database class="h-4 w-4" />
          {{ t("tableToolbox.generateData") }}
        </DropdownMenuItem>
        <DropdownMenuItem v-if="props.canImport" class="gap-2" @click="emit('importData')">
          <Download class="h-4 w-4" />
          {{ t("tableToolbox.importData") }}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger class="gap-2">
            <Upload class="h-4 w-4" />
            {{ t("tableToolbox.exportData") }}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem @click="emit('exportData', 'csv')"> CSV </DropdownMenuItem>
              <DropdownMenuItem @click="emit('exportData', 'json')"> JSON </DropdownMenuItem>
              <DropdownMenuItem @click="emit('exportData', 'sql')"> SQL INSERT </DropdownMenuItem>
              <DropdownMenuItem @click="emit('exportData', 'xlsx')"> XLSX </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
