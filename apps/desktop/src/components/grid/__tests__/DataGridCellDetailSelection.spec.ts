import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dataGridSource = readFileSync(new URL("../DataGrid.vue", import.meta.url), "utf8");
const largeValueSource = readFileSync(new URL("../../../composables/useDataGridLargeValues.ts", import.meta.url), "utf8");

describe("DataGrid cell detail selection", () => {
  it("selects the first available cell when opening Mongo JSON preview without a selection", () => {
    const togglePreview = dataGridSource.match(/function toggleMongoJsonPreview[\s\S]*?\n\}/)?.[0];
    expect(togglePreview).toContain("if (showMongoJsonPreview.value)");
    expect(togglePreview).toContain("!currentSelectedCellPosition() && displayItems.value.length > 0 && visibleColumnIndexes.value.length > 0");
    expect(togglePreview).toContain("selectSingleCell(0, 0)");
  });

  it("keeps Canvas hover state while the renderer swaps drawing surfaces", () => {
    expect(dataGridSource).toContain("function isCanvasGridInteractionTarget(target: Node): boolean");
    expect(dataGridSource).toContain("canvasOverlayRef.value?.contains(target) === true");
    expect(dataGridSource).toContain("canvasRef.value?.contains(target) === true");
    expect(dataGridSource).toContain("canvasBackRef.value?.contains(target) === true");

    const canvasLeave = dataGridSource.match(/function onCanvasMouseLeave[\s\S]*?\n\}/)?.[0];
    const actionLeave = dataGridSource.match(/function clearCanvasActionHover[\s\S]*?\n\}/)?.[0];
    expect(canvasLeave).toContain("isCanvasGridInteractionTarget(relatedTarget)");
    expect(actionLeave).toContain("isCanvasGridInteractionTarget(relatedTarget)");
  });

  it("keeps the canvas action overlay tied to hovered and quick-download cells only", () => {
    const overlayCell = dataGridSource.match(/const canvasActionOverlayCell = computed[\s\S]*?\n\}\);/)?.[0];
    expect(overlayCell).toContain("const target = hoveredActionCell.value ?? quickDownloadMenuCell.value;");
    expect(overlayCell).not.toContain("cellDetailButtonEnabled");
    expect(dataGridSource).not.toContain("cellDetailButtonEnabled");
    expect(dataGridSource).not.toContain("showCellDetail");
  });

  it("keeps context-menu details and refresh restoration independent of the hover overlay", () => {
    expect(dataGridSource).toContain("cellDetails: openContextCellDetailDialog");
    expect(dataGridSource).toContain("if (cellDialog) openCellDetailDialog(cellDialog.rowIndex, cellDialog.col);");
  });

  it("hydrates bounded large-value previews for every cell detail target", () => {
    expect(largeValueSource).toContain("function isLargeValuePreview");
    expect(dataGridSource).toContain("function hydrateLargeValueCell");
    expect(dataGridSource).toMatch(/function openCellDetailDialog[\s\S]*?hydrateCellDetailTarget\(cellDetailDialogTarget\.value\)/);
  });
});
