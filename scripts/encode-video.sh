#!/usr/bin/env bash
# Dərs videosunu veb üçün hazırlayır: sıxır, poster kadrı çıxarır, ölçünü yoxlayır.
#
# NİYƏ LAZIMDIR
# Videolar Worker static assets-dən verilir və orada FAYL BAŞINA 25 MiB limiti var.
# Kameradan/ekran yazısından çıxan fayl adətən bundan qat-qat böyük olur. Bu skript
# həmin faylı brauzerə uyğun formata salır və limitə sığmasa açıq xəbərdarlıq edir.
#
# ÖLÇÜLDÜ (720p, CRF 26):
#   slayd + səsli izah (az hərəkət) → ~5 MB/dəq  → 4 dəqiqə ≈ 2-3 MB
#   danışan adam                    → ~3-8 MB/dəq
#   yüksək hərəkətli məzmun         → ~16 MB/dəq → 25 MiB-ı 2 dəqiqədə keçir
# Yəni slayd tipli dərs videosu üçün limit problem deyil.
#
# İSTİFADƏ
#   bash scripts/encode-video.sh xam-video.mp4 ry1-sayma-l1
#
# Nəticə:
#   public/videos/ry1-sayma-l1.mp4   — video
#   public/videos/ry1-sayma-l1.jpg   — poster (2-ci saniyədən)
# Sonra admin paneldə dərsə `/videos/ry1-sayma-l1.mp4` ünvanını yazırsan.

set -euo pipefail

IN="${1:-}"
NAME="${2:-}"
if [[ -z "$IN" || -z "$NAME" ]]; then
  echo "İstifadə: bash scripts/encode-video.sh <xam-video> <dərs-id>" >&2
  exit 1
fi
[[ -f "$IN" ]] || { echo "Fayl tapılmadı: $IN" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg quraşdırılmayıb" >&2; exit 1; }

OUT_DIR="public/videos"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$NAME.mp4"
POSTER="$OUT_DIR/$NAME.jpg"

# -crf 26      : keyfiyyət/ölçü tarazlığı; izah videosu üçün kifayətdir
# -vf scale    : eni 1280-ə endirir (daha böyüyün mənası yoxdur), tək piksel olmasın deyə -2
# -movflags +faststart : metadata faylın ƏVVƏLİNƏ keçir — video tam yüklənmədən oynamağa başlayır
# -ac 1, 64k   : izah səsi mono kifayətdir, stereo yalnız faylı böyüdür
ffmpeg -y -i "$IN" \
  -vf "scale='min(1280,iw)':-2" \
  -c:v libx264 -preset medium -crf 26 -profile:v high -pix_fmt yuv420p \
  -movflags +faststart \
  -c:a aac -b:a 64k -ac 1 \
  "$OUT" 2>/dev/null

# Poster: 2-ci saniyə (0-cı saniyə çox vaxt qara kadr olur)
ffmpeg -y -ss 2 -i "$OUT" -frames:v 1 -vf "scale='min(1280,iw)':-2" -q:v 4 "$POSTER" 2>/dev/null

BYTES=$(stat -c%s "$OUT")
MIB=$(awk "BEGIN{printf \"%.1f\", $BYTES/1048576}")
SEC=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null | cut -d. -f1)

echo "$OUT — ${MIB} MiB, ${SEC} san"
echo "$POSTER — poster"

# 25 MiB Worker static assets limitidir. 24-də xəbərdarlıq edirik ki, sərhədə
# dayanmış fayl deploy-da gözlənilmədən sınmasın.
if (( BYTES > 24 * 1048576 )); then
  echo "" >&2
  echo "XƏBƏRDARLIQ: ${MIB} MiB — Worker static assets limiti 25 MiB." >&2
  echo "  Seçimlər: videonu qısalt, -crf 30 sına, və ya 854x480-ə endir." >&2
  exit 2
fi

echo ""
echo "Admin paneldə dərsin video ünvanı: /videos/$NAME.mp4"
