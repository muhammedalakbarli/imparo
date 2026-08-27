// Cloudflare Worker secret-lərinin tipi — `getCloudflareContext().env`-ə əlavə
// sahələr kimi görünsün deyə. `@opennextjs/cloudflare`-in özündəki `CloudflareEnv`
// interfeysinə declaration merging ilə qoşulur (bax node_modules/@opennextjs/
// cloudflare/dist/api/cloudflare-context.d.ts). `npx wrangler types` işlətməyə
// ehtiyac yoxdur — bu adlar `wrangler secret put` ilə qoyulub, wrangler.jsonc-də
// bəyan edilmədiyi üçün avtomatik generasiya oluna bilmirdi.
declare global {
  interface CloudflareEnv {
    CRON_SECRET?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;
    LEMONSQUEEZY_WEBHOOK_SECRET?: string;
    RESEND_API_KEY?: string;
    // wrangler.jsonc-dəki statik asset binding-i. `lib/api/content.ts` DB boş olanda
    // /content-seed.json-u bununla oxuyur (məzmunu Worker bundle-ına salmamaq üçün).
    ASSETS: { fetch: (req: Request | URL | string) => Promise<Response> };
  }
}
export {};
