import { AdminError } from "@/admin/contracts";
import type { AdmissionStatus, AdmissionsControl, AdmissionsState } from "@/admin/results/admissions";
import { supabaseRequest } from "../supabase";
import { resultsConfiguration } from "./service";
type Row = { is_open: boolean; revision: number };
function project(row: Row): AdmissionsState {
 if (typeof row?.is_open !== "boolean" || !Number.isSafeInteger(row.revision) || row.revision < 0) throw new AdminError(503,"Status upisa trenutno nije dostupan.");
 return {status:row.is_open ? "open" : "closed",revision:row.revision};
}
export async function readAdmissions(): Promise<AdmissionsState> {
 resultsConfiguration();
 const rows = await (await supabaseRequest("/rest/v1/medresa_admissions_status?singleton=eq.true&select=is_open,revision&limit=1",{redirect:"error"})).json();
 return project(rows[0]);
}
export async function admissionsControl(): Promise<AdmissionsControl> {
 try { const c = resultsConfiguration(); return { state:await readAdmissions(),writable:c.writable,message:c.writable ? null : "Status upisa je dostupan samo za čitanje." }; }
 catch { return {state:null,writable:false,message:"Status upisa još nije povezan. Primijenite Preview migraciju 202610100005_admissions_status.sql."}; }
}
export async function publicAdmissionStatus(): Promise<AdmissionStatus | null> { try { return (await readAdmissions()).status; } catch { return null; } }
export async function setAdmissions(status: unknown, expected: unknown, actor: string): Promise<AdmissionsState> {
 resultsConfiguration(true);
 if (!['open','closed'].includes(status as string) || !Number.isSafeInteger(expected) || (expected as number)<0 || (expected as number)>9007199254740990) throw new AdminError(422,"Status upisa nije ispravan.");
 try {
  const row = await (await supabaseRequest("/rest/v1/rpc/medresa_admissions_set_status",{method:"POST",redirect:"error",headers:{"Content-Type":"application/json"},body:JSON.stringify({p_open:status === "open",p_expected:expected,p_actor:actor})},true)).json();
  return project(row);
 } catch(error) { if(error instanceof AdminError && error.status===409) throw new AdminError(409,"Status upisa je promijenjen u drugom prozoru. Osvježite stranicu."); throw error; }
}
