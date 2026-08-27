#!/usr/bin/env python3
"""
Yaşıl ekran (green screen) renderindən şəffaf PNG maskot aseti hazırlayır.

NİYƏ SABİT RƏNG EŞİYİ YOX, NİSBƏT:
Renderlərdə fon vahid deyil — parlaqlıq qradiyenti olur (bir küncdə yaşıl 138,
o birində 194). Mütləq eşik belə fonu ya tam tutmur, ya obyektin kölgəsini də
yeyir. Ona görə ölçü kimi `G − max(R, B)` işlədilir: fonda bu fərq güclü müsbət,
obyektdə (narıncı tülkü, qəhvəyi ayı, çəhrayı çiçək) mənfi və ya sıfıra yaxındır.

NİYƏ BAĞLI KOMPONENT SÜZGƏCİ:
Bəzi renderlərdə döşəmədə konfetti/kölgə olur. Kəsimdən sonra onlar ayrı-ayrı
ləkələr kimi qalır və şəffaf fonda "çirk" görünür. Ona görə yalnız ƏSAS obyekt
və onun çərçivəsinə YAXIN kiçik detallar (başın üstündəki ulduzlar kimi)
saxlanılır — uzaqdakı təkbaşına ləkələr atılır.

İSTİFADƏ
  python3 scripts/cutout.py "Maskot/maskot 3d/ayi-elsallayir.jpeg" ayi
  → public/assets/images/zefi/ayi.png və mobile/assets/zefi/ayi.png (512×512)

Sonra components/ZefiMascot.tsx-də `ZefiEmotion`-a və SRC xəritəsinə ad əlavə et.
"""
import sys
from collections import deque

from PIL import Image, ImageFilter
import numpy as np

# Yumşaq keçid zolağı: bundan aşağısı tam obyekt, yuxarısı tam fon.
# Dar zolaq dişli kənar, geniş zolaq isə "halo" verir.
LO, HI = 8.0, 34.0
# Əsas obyektin çərçivəsindən bu qədər piksel kənardakı detallar da saxlanılır.
NEAR_PAD = 60
# Bundan kiçik ayrı ləkələr səs-küydür.
MIN_BLOB = 40
# 512-lik kətanda obyektin hündürlüyü və yuxarı kənarı — bütün maskot dəsti
# eyni kompozisiyada dursun deyə (ZefiMascot-un arxa diski buna bağlıdır).
CANVAS, TARGET_H, TOP = 512, 440, 36


def largest_components(solid: np.ndarray):
    """Bağlı komponentləri tap; (etiket massivi, ölçülər, çərçivələr) qaytar."""
    h, w = solid.shape
    lbl = np.zeros(solid.shape, np.int32)
    sizes, boxes, n = {}, {}, 0
    for sy in range(h):
        for sx in range(w):
            if solid[sy, sx] and lbl[sy, sx] == 0:
                n += 1
                q = deque([(sy, sx)])
                lbl[sy, sx] = n
                cnt = 0
                y0 = y1 = sy
                x0 = x1 = sx
                while q:
                    y, x = q.popleft()
                    cnt += 1
                    y0, y1 = min(y0, y), max(y1, y)
                    x0, x1 = min(x0, x), max(x1, x)
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and solid[ny, nx] and lbl[ny, nx] == 0:
                            lbl[ny, nx] = n
                            q.append((ny, nx))
                sizes[n], boxes[n] = cnt, (y0, y1, x0, x1)
    return lbl, sizes, boxes


def cutout(src_path: str) -> Image.Image:
    im = Image.open(src_path).convert("RGB")
    a = np.array(im).astype(np.float32)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    greenness = G - np.maximum(R, B)
    alpha = np.clip((HI - greenness) / (HI - LO), 0, 1)

    lbl, sizes, boxes = largest_components(alpha > 0.55)
    if not sizes:
        raise SystemExit(f"{src_path}: obyekt tapılmadı — fon yaşıl deyil?")
    main = max(sizes, key=sizes.get)
    my0, my1, mx0, mx1 = boxes[main]

    keep = np.zeros(lbl.shape, bool)
    for i, (y0, y1, x0, x1) in boxes.items():
        near = (
            y1 >= my0 - NEAR_PAD and y0 <= my1 + NEAR_PAD
            and x1 >= mx0 - NEAR_PAD and x0 <= mx1 + NEAR_PAD
        )
        if i == main or (near and sizes[i] >= MIN_BLOB):
            keep |= lbl == i

    mask = Image.fromarray((keep * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5))
    alpha = alpha * (np.array(mask).astype(np.float32) / 255.0)

    # Yaşıl sızma: kənar piksellərdə fonun yaşılı obyektə düşür. G-ni R və B-nin
    # ortasına endiririk — yalnız G artıq olduğu yerdə, yəni obyektin öz yaşılına
    # (varsa) toxunmadan.
    spill = G > (R + B) / 2
    Gf = np.where(spill, np.minimum(G, (R + B) / 2 + 6), G)

    out = np.dstack([R, Gf, B, alpha * 255]).astype("uint8")
    res = Image.fromarray(out, "RGBA")
    return res.crop(res.getbbox())


def fit_canvas(img: Image.Image) -> Image.Image:
    """Bütün maskot dəsti ilə eyni kompozisiyada 512×512 kətana otur."""
    scale = TARGET_H / img.height
    w = max(1, round(img.width * scale))
    r = img.resize((w, TARGET_H), Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(r, ((CANVAS - w) // 2, TOP), r)
    return canvas


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("İstifadə: python3 scripts/cutout.py <yaşıl-ekran-şəkli> <ad>")
    src, name = sys.argv[1], sys.argv[2]
    final = fit_canvas(cutout(src))
    for out in (f"public/assets/images/zefi/{name}.png", f"mobile/assets/zefi/{name}.png"):
        final.save(out)
        print("yazıldı:", out)
    print("çərçivə:", final.split()[3].getbbox())


if __name__ == "__main__":
    main()
