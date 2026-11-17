// /api/tts provayder seçimi: Azure açarı varsa Azure, yoxdursa və ya Azure xəta
// verərsə Google (tl=tr + fonetik). Azure hesabı hələ yoxdur — davranış burada
// saxta fetch ilə yoxlanır ki, açar qoyulan gün sürpriz olmasın.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env: Record<string, string | undefined> = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env, ctx: { waitUntil: () => {} } }),
}));

import { GET } from "@/app/api/tts/route";

const mp3 = () => new Response(new Uint8Array([0xff, 0xf3, 0x84, 0x00]), { status: 200 });
const call = (q: string) => GET(new Request(`https://imparo.app/api/tts?${q}`));

describe("/api/tts provayder seçimi", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete env.AZURE_SPEECH_KEY;
    delete env.AZURE_SPEECH_REGION;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("Azure açarı yoxdursa AZ mətni Google tl=tr ilə gəlir (qısa brauzer keşi)", async () => {
    fetchMock.mockResolvedValueOnce(mp3());
    const res = await call("lang=az&text=" + encodeURIComponent("3 + 2 = ?"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-TTS-Provider")).toBe("google");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("tl=tr");
  });

  it("Azure açarı varsa AZ mətni Banu səsi ilə Azure-dan gəlir", async () => {
    env.AZURE_SPEECH_KEY = "test-key";
    env.AZURE_SPEECH_REGION = "westeurope";
    fetchMock.mockResolvedValueOnce(mp3());
    const res = await call("lang=az&text=" + encodeURIComponent("3 + 2 = ?"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-TTS-Provider")).toBe("azure");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1");
    expect(init.method).toBe("POST");
    expect(init.body).toContain("az-AZ-BanuNeural");
    // Azure-a təbii AZ mətni gedir (türk fonetikası YOX): "üstəgəl", "bərabərdir".
    expect(init.body).toContain("üstəgəl");
    expect(init.body).toContain("bərabərdir");
  });

  it("Azure xəta verərsə (kvota/açar) uşaq səssiz qalmır — Google-a düşür", async () => {
    env.AZURE_SPEECH_KEY = "bad-key";
    env.AZURE_SPEECH_REGION = "westeurope";
    fetchMock.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
    fetchMock.mockResolvedValueOnce(mp3());
    const res = await call("lang=az&text=salam");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-TTS-Provider")).toBe("google");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("tl=tr");
  });

  it("Azure şəbəkə xətası atsa da Google-a düşür", async () => {
    env.AZURE_SPEECH_KEY = "k";
    env.AZURE_SPEECH_REGION = "westeurope";
    fetchMock.mockRejectedValueOnce(new Error("network"));
    fetchMock.mockResolvedValueOnce(mp3());
    const res = await call("lang=az&text=salam");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-TTS-Provider")).toBe("google");
  });

  it("İngilis səsi Azure açarı olsa da Google en ilə qalır", async () => {
    env.AZURE_SPEECH_KEY = "k";
    env.AZURE_SPEECH_REGION = "westeurope";
    fetchMock.mockResolvedValueOnce(mp3());
    const res = await call("text=apple");
    expect(res.headers.get("X-TTS-Provider")).toBe("google");
    expect(String(fetchMock.mock.calls[0][0])).toContain("tl=en");
  });
});
