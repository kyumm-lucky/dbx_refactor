<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2 } from "@lucide/vue";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSqlHighlighter } from "@/composables/useSqlHighlighter";
import { useConnectionStore } from "@/stores/connectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import * as api from "@/lib/backend/api";
import { executeWithProductionSqlGuard } from "@/lib/database/productionExecutionGuard";
import { queryTimeoutSecsForConnection } from "@/lib/sql/queryTimeout";
import { buildRenameObjectSql } from "@/lib/table/objectRenameSql";
import { executeOracleTableRename, prepareOracleTableRename, type OracleTableRenamePlan } from "@/lib/table/oracleTableRename";
import type { DatabaseType } from "@/types/database";

/**
 * Renames the table currently open in the structure view. The dialog owns the
 * SQL preview and execution so the sidebar rename flow and this entry point
 * only share the same primitives (buildRenameObjectSql / oracleTableRename)
 * and the same production safety guard.
 */
const props = defineProps<{
  open: boolean;
  connectionId: string;
  database: string;
  schema?: string;
  tableName: string;
  databaseType?: DatabaseType;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  renamed: [payload: { oldName: string; newName: string }];
}>();

// Oracle-family renames may need to rewrite dependent objects, so their
// preview runs the full prepare pass (metadata reads) instead of a single
// ALTER statement. Debounce typing either way so keystrokes do not fan out to
// the backend.
const PREVIEW_DEBOUNCE_MS = 300;

const { t } = useI18n();
const { highlight } = useSqlHighlighter();
const connectionStore = useConnectionStore();
const settingsStore = useSettingsStore();

const newName = ref("");
const previewSql = ref("");
const errorMessage = ref("");
const previewLoading = ref(false);
const executing = ref(false);
const oraclePlan = ref<OracleTableRenamePlan>();
let previewRequestId = 0;
let previewTimer: ReturnType<typeof setTimeout> | undefined;

const isOracleTable = computed(() => props.databaseType === "oracle" || props.databaseType === "oceanbase-oracle");
const trimmedName = computed(() => newName.value.trim());
const nameChanged = computed(() => !!trimmedName.value && trimmedName.value !== props.tableName);
const highlightedPreview = computed(() => (previewSql.value ? highlight(previewSql.value) : ""));
const confirmLabel = computed(() => t("contextMenu.renameObject"));
const canConfirm = computed(() => nameChanged.value && !previewLoading.value && !executing.value && !errorMessage.value && (!isOracleTable.value || oraclePlan.value?.executable === true));

function resetPreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = undefined;
  ++previewRequestId;
  previewSql.value = "";
  oraclePlan.value = undefined;
  errorMessage.value = "";
  previewLoading.value = false;
}

function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    previewTimer = undefined;
    void refreshPreview();
  }, PREVIEW_DEBOUNCE_MS);
}

async function refreshPreview() {
  const requestId = ++previewRequestId;
  oraclePlan.value = undefined;
  previewSql.value = "";
  errorMessage.value = "";
  if (!props.open || !nameChanged.value) {
    previewLoading.value = false;
    return;
  }
  previewLoading.value = true;
  try {
    if (isOracleTable.value) {
      const plan = await prepareOracleTableRename({
        connectionId: props.connectionId,
        database: props.database,
        databaseType: props.databaseType as "oracle" | "oceanbase-oracle",
        schema: props.schema || props.database,
        oldName: props.tableName,
        newName: trimmedName.value,
      });
      if (requestId !== previewRequestId) return;
      oraclePlan.value = plan;
      previewSql.value = `-- ${t("objects.tableRenameCoverage")}\n\n${plan.statements.join("\n\n")}`;
      if (!plan.executable) errorMessage.value = t("objects.viewRenameValidationPending");
    } else {
      const sql = await buildRenameObjectSql({
        databaseType: props.databaseType,
        objectType: "TABLE",
        schema: props.schema,
        oldName: props.tableName,
        newName: trimmedName.value,
      });
      if (requestId !== previewRequestId) return;
      previewSql.value = sql;
    }
  } catch (error) {
    if (requestId === previewRequestId) errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (requestId === previewRequestId) previewLoading.value = false;
  }
}

// A rename dialog is bound to one table identity: reopening (or navigating to
// another table while it is open) restarts from the current name.
watch(
  () => [props.open, props.connectionId, props.database, props.schema, props.tableName] as const,
  ([open]) => {
    resetPreview();
    if (!open) return;
    newName.value = props.tableName;
    schedulePreview();
  },
  { immediate: true },
);

watch(newName, () => {
  if (!props.open) return;
  schedulePreview();
});

function updateOpen(open: boolean) {
  // Renaming is a mutating multi-step operation on Oracle; never let a stray
  // outside click dismiss the dialog while it is still running.
  if (executing.value) return;
  emit("update:open", open);
}

async function confirmRename() {
  if (!canConfirm.value) return;
  const oldName = props.tableName;
  const requestedName = trimmedName.value;
  const plan = oraclePlan.value;
  const sql = plan ? plan.statements.join("\n\n") : previewSql.value;
  if (!sql) return;
  const connection = connectionStore.getConfig(props.connectionId);
  let appliedName = requestedName;
  executing.value = true;
  errorMessage.value = "";
  try {
    await connectionStore.ensureConnected(props.connectionId);
    const executed = await executeWithProductionSqlGuard({
      connection,
      database: props.database,
      sql,
      source: t("production.sourceStructure"),
      execute: async () => {
        if (plan) {
          await executeOracleTableRename(plan, {}, () => props.open && executing.value);
          appliedName = plan.canonicalNewName;
          return true;
        }
        const timeoutSecs = queryTimeoutSecsForConnection(connection, settingsStore.editorSettings.globalQueryTimeoutSecs);
        await api.executeQuery(props.connectionId, props.database, sql, props.schema, undefined, { timeoutSecs });
        return true;
      },
    });
    // The production guard resolves undefined when the user declines the
    // confirmation or the connection is read-only: keep the dialog open.
    if (!executed) return;
    emit("renamed", { oldName, newName: appliedName });
    emit("update:open", false);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    executing.value = false;
  }
}

onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer);
  ++previewRequestId;
});
</script>

<template>
  <Dialog :open="props.open" @update:open="updateOpen">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ t("contextMenu.renameObjectTitle") }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-3">
        <Input v-model="newName" :placeholder="t('contextMenu.renameObjectNamePlaceholder')" :disabled="executing" data-rename-table-input @keydown.enter.prevent="confirmRename" />
        <div class="relative">
          <pre v-if="highlightedPreview" class="max-h-48 min-w-0 max-w-full overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap" data-rename-table-preview v-html="highlightedPreview"></pre>
          <div v-else class="flex h-16 items-center justify-center rounded bg-muted/40 text-xs text-muted-foreground">
            <Loader2 v-if="previewLoading" class="mr-2 h-3.5 w-3.5 animate-spin" />
            <span data-rename-table-preview-empty>{{ previewLoading ? t("common.loading") : t("contextMenu.renameObjectPreviewHint") }}</span>
          </div>
          <Loader2 v-if="previewLoading && highlightedPreview" class="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
        <p v-if="errorMessage" class="min-w-0 max-w-full overflow-x-auto text-sm text-destructive" data-rename-table-error>{{ errorMessage }}</p>
      </div>
      <DialogFooter>
        <Button variant="outline" :disabled="executing" @click="updateOpen(false)">{{ t("dangerDialog.cancel") }}</Button>
        <Button :disabled="!canConfirm" data-rename-table-confirm @click="confirmRename">
          <Loader2 v-if="executing" class="mr-1.5 h-3.5 w-3.5 animate-spin" />
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
