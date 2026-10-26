import { AdminError } from "@/admin/contracts";

export const PDF_MAINTENANCE_MESSAGE = "Upravljanje PDF rezultatima je privremeno obustavljeno. Objavljeni PDF dokumenti ostaju dostupni.";

/** Entire PDF subsystem, including reads/downloads. Default: isolated. */
export function pdfModuleEnabled() {
  return process.env.MEDRESA_RESULTS_PDF_MODULE_ENABLED === "true";
}

export function requirePdfModule() {
  if (!pdfModuleEnabled()) throw new AdminError(404, PDF_MAINTENANCE_MESSAGE);
}

/** Server-only opt-in. Existing publications and admissions status are unaffected. */
export function pdfManagementEnabled() {
  return pdfModuleEnabled() && process.env.MEDRESA_RESULTS_PDF_MANAGEMENT_ENABLED === "true";
}

export function requirePdfManagement() {
  requirePdfModule();
  if (!pdfManagementEnabled()) throw new AdminError(423, PDF_MAINTENANCE_MESSAGE);
}
