import { publishedNews, publicNewsRequest } from "@/server/public/news";
import { safeId } from "@/admin/contracts";

/** Private bucket, public derivative only when referenced by an active publication. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!safeId(id)) return missing();
  try {
    const rows = await publishedNews();
    if (!rows.some(row => row.snapshot.photos.some(photo => photo.src === `/api/news/media/${id}`))) return missing();
    const assets = await (await publicNewsRequest(`/rest/v1/medresa_admin_assets?id=eq.${encodeURIComponent(id)}&origin=eq.upload&select=bucket,object_path,mime&limit=1`)).json();
    const asset = Array.isArray(assets) && assets.length === 1 ? assets[0] : null;
    if (!asset || asset.bucket !== "medresa-news-preview" || asset.object_path !== `images/${id}.webp` || asset.mime !== "image/webp") return missing();
    const result = await publicNewsRequest(`/storage/v1/object/authenticated/medresa-news-preview/${asset.object_path}`);
    const bytes = await result.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 10*1024*1024) return missing();
    return new Response(bytes, { headers: { "Content-Type": "image/webp", "Content-Disposition": "inline", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return missing(); }
}
