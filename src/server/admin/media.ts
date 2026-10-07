import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { AdminError, safeId } from "@/admin/contracts";
import { emptyText, type SharedImage } from "@/admin/model";
import { archiveAssets } from "./news";
import { supabaseConfiguration, supabaseRequest } from "./supabase";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
type AssetRow = { id: string; metadata: SharedImage; object_path: string; mime: string };
export async function listImages() {
  if (!supabaseConfiguration()) return archiveAssets();
  const uploaded: AssetRow[] = await (await supabaseRequest("/rest/v1/medresa_admin_assets?origin=eq.upload&select=id,metadata,object_path,mime&order=created_at.desc")).json();
  return [...uploaded.map(r => r.metadata), ...archiveAssets()];
}
export async function optimizeImage(bytes: Buffer, mime: string) {
  if (!IMAGE_MIMES.includes(mime) || !bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new AdminError(422, "Odaberite JPG, PNG ili WebP sliku do 10 MB.");
  try {
    const pipeline = sharp(bytes, { limitInputPixels: 40000000, animated: false, failOn: "warning" });
    const metadata = await pipeline.metadata();
    const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[mime];
    if (metadata.format !== expected || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1 || metadata.width > 20000 || metadata.height > 20000) throw new Error("Invalid image");
    // Lossless pixel derivative: EXIF orientation applied, metadata removed, original retained privately.
    const output = await pipeline.rotate().webp({ lossless: true, effort: 4 }).toBuffer({ resolveWithObject: true });
    if (output.data.length > MAX_IMAGE_BYTES) throw new AdminError(422, "Obrađena slika prelazi 10 MB. Odaberite manju fotografiju.");
    return { bytes: output.data, width: output.info.width, height: output.info.height };
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError(422, "Datoteka nije podržana slika ili je oštećena (najviše 40 megapiksela).");
  }
}
export async function uploadImage(bytes: Buffer, mime: string, actor: string): Promise<SharedImage> {
  const config = supabaseConfiguration();
  if (!config || !config.writable) throw new AdminError(503, "Upload čeka povezivanje Supabase Preview Storage-a.");
  const optimized = await optimizeImage(bytes, mime);
  const id = randomUUID(); const path = `images/${id}.webp`;
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const original = `originals/${id}.${ext}`;
  const store = (objectPath: string, body: Buffer, contentType: string) => supabaseRequest(`/storage/v1/object/${config.bucket}/${objectPath}`, { method: "POST", headers: { "Content-Type": contentType, "x-upsert": "false" }, body: new Uint8Array(body) }, true);
  // Never overwrite. Partial failures leave recoverable objects; do not delete automatically.
  await store(original, bytes, mime); await store(path, optimized.bytes, "image/webp");
  const asset: SharedImage = { id, src: `/api/admin/media/${id}`, width: optimized.width, height: optimized.height, alt: emptyText() };
  await supabaseRequest("/rest/v1/medresa_admin_assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, origin: "upload", bucket: config.bucket, object_path: path, original_path: original, mime: "image/webp", bytes: optimized.bytes.length, metadata: asset, created_by: actor }) }, true);
  return asset;
}
export async function readImage(id: string) {
  if (!safeId(id)) throw new AdminError(404, "Slika nije pronađena.");
  const rows: AssetRow[] = await (await supabaseRequest(`/rest/v1/medresa_admin_assets?id=eq.${encodeURIComponent(id)}&origin=eq.upload&select=metadata,object_path,mime&limit=1`)).json();
  if (!rows[0]) throw new AdminError(404, "Slika nije pronađena.");
  const config = supabaseConfiguration()!;
  const response = await supabaseRequest(`/storage/v1/object/authenticated/${config.bucket}/${rows[0].object_path}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) throw new AdminError(422, "Slika je prevelika za pregled.");
  return { bytes, mime: rows[0].mime };
}
