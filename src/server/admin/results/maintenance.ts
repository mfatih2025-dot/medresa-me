import { AdminError } from "@/admin/contracts";

export const PDF_MAINTENANCE_MESSAGE = "Upravljanje PDF rezultatima je privremeno obustavljeno. Objavljeni PDF dokumenti ostaju dostupni.";

/** Server-only opt-in. Existing publications and admissions status are unaffected. */
export function pdfManagementEnabled() {
  return process.env.MEDRESA_RESULTS_PDF_MANAGEMENT_ENABLED === "true";
}

export function requirePdfManagement() {
  if (!pdfManagementEnabled()) throw new AdminError(423, PDF_MAINTENANCE_MESSAGE);
}
