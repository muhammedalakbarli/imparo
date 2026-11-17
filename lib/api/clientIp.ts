// İstəyin real IP-si — Cloudflare `cf-connecting-ip` başlığını özü qoyur (müştəri
// saxtalaşdıra bilmir). Lokal inkişafda yoxdur → "local".
export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local"
  );
}
