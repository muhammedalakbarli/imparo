"use client";

// Dərs videosu — giriş ekranında, tapşırıqlardan ƏVVƏL (sofatutor modeli).
//
// QƏSDƏN NATIV <video>: üçüncü tərəf pleyer kitabxanası bundle-a onlarla KB
// əlavə edir və Worker-in 3 MiB yükünə sayılır. Nativ element mobil brauzerlərdə
// tam ekran, sürət, altyazı və AirPlay/Cast-i onsuz da özü verir.
//
// `preload="none"` VACİBDİR: şagird videonu izləməyə bilər (qaydanı bilirsə
// birbaşa məşqə keçər). Önyükləmə açıq olsaydı hər dərs açılışında bir neçə MB
// mobil internet yanardı — Azərbaycanda bu, real xərcdir.

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { LessonVideo as LessonVideoData } from "@/lib/types";

function label(sec?: number): string | null {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} dəq ${s ? `${s} san` : ""}`.trim() : `${s} san`;
}

export default function LessonVideo({
  video,
  onWatched,
}: {
  video: LessonVideoData;
  /** Video sona çatanda bir dəfə çağırılır (irəliləyiş üçün). */
  onWatched?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const done = useRef(false);

  const dur = label(video.durationSec);

  // Video yüklənməsə dərs BLOKLANMAMALIDIR — şagird tapşırıqlara keçə bilər.
  if (failed) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-line bg-panel p-4 text-sm font-semibold text-muted">
        Video açılmadı — internet zəif ola bilər. Dərsə onsuz da davam edə bilərsən.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border-2 border-line bg-black">
      <div className="relative">
        <video
          ref={ref}
          className="block aspect-video w-full"
          controls={started}
          preload="none"
          playsInline
          poster={video.poster}
          onError={() => setFailed(true)}
          onEnded={() => {
            if (done.current) return;
            done.current = true;
            onWatched?.();
          }}
        >
          <source src={video.src} />
          {video.captions && (
            <track kind="captions" src={video.captions} srcLang="az" label="Azərbaycanca" default />
          )}
        </video>

        {/* Öz oynatma düyməmiz: `controls` yalnız başlayandan sonra açılır ki,
            başlamamış ekran səliqəli görünsün və poster tam görünsün. */}
        {!started && (
          <button
            type="button"
            aria-label="Videonu oynat"
            onClick={() => {
              setStarted(true);
              void ref.current?.play();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand shadow-lg">
              <Play size={30} strokeWidth={3} className="ml-1" />
            </span>
          </button>
        )}
      </div>

      {dur && (
        <div className="bg-panel px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">
          Video · {dur}
        </div>
      )}
    </div>
  );
}
