// Tədris platformasının əsas məlumat tipləri.
// Bu tiplər həm lokal seed məzmununda, həm də sonradan Supabase DB-də istifadə olunur.

export type TaskType =
  | "match_pairs"
  | "multiple_choice"
  | "fill_blank"
  | "numeric"
  | "word_order" // sözləri düz sıraya düz (cümlə quran)
  | "listening"; // dinlə və seç

// Tapşırığın yanında göstərilən şəkil (illüstrasiya) növləri
export type TaskFigure =
  | { kind: "fractionBar"; parts: number; filled: number } // bölünmüş zolaq
  | {
      kind: "compareBars";
      a: { parts: number; filled: number };
      b: { parts: number; filled: number };
    } // iki zolaq yan-yana
  | { kind: "dots"; total: number; filled?: number } // dairələr
  | { kind: "emoji"; items: string[] }; // emoji obyektlər

// Bütün tapşırıqlar üçün ümumi sahələr
interface TaskBase {
  id: string;
  type: TaskType;
  prompt: string; // sualın mətni
  figure?: TaskFigure; // sualı canlandıran şəkil (istəyə bağlı)
  xp: number; // düzgün cavaba görə qazanılan XP
  // Variantlar İngilis sözdürsə: seçiləndə avtomatik səslənir (TTS ilə tələffüz).
  // Yalnız BÜTÜN variantları İngilis olan tapşırıqlarda true qoyulur.
  speakOptions?: boolean;

  // Cavabdan sonra nəticə lövhəsində göstərilən izah: MƏHZ BU SUALIN cavabı
  // niyə belədir. Dərsin ümumi qaydası DEYİL — şagird artıq sualı görüb, ona
  // "yüzlük, onluq, təklik var" demək kömək etmir; "345-də 3 yüzlük var, çünki
  // soldan birinci rəqəm yüzlükdür" kömək edir.
  // İstəyə bağlıdır: yazılmayıbsa lövhədə izah bloku ümumiyyətlə göstərilmir.
  explanation?: string;

  // Bu tapşırığın yoxladığı bacarıqlar (bax lib/skills.ts). Cəhd `task_attempts`-a
  // yazılanda dərsə yox, məhz bu bacarıqlara proyeksiya olunur — mənimsəmə
  // (mastery) və adaptiv tapşırıq seçimi buna söykənir.
  // Bir tapşırıq bir neçə bacarıq daşıya bilər: mətn məsələsi həm `problem.one_step`,
  // həm də istifadə etdiyi əməli (`arith.sub.borrow`) yoxlayır.
  skills?: string[];
}

// Çoxseçimli sual
export interface MultipleChoiceTask extends TaskBase {
  type: "multiple_choice";
  options: string[];
  correctIndex: number;
}

// Boşluq doldurma (mətn cavabı)
export interface FillBlankTask extends TaskBase {
  type: "fill_blank";
  // birdən çox düzgün variant ola bilər (məs. böyük/kiçik hərf)
  accepted: string[];
}

// Rəqəm cavabı (riyaziyyat)
export interface NumericTask extends TaskBase {
  type: "numeric";
  answer: number;
  tolerance?: number; // icazə verilən fərq (məs. onluq kəsrlər üçün)
}

// Cümlə quran — qarışıq sözləri düzgün sıraya düz (İngilis cümlə qurma məşqi)
export interface WordOrderTask extends TaskBase {
  type: "word_order";
  words: string[]; // qarışıq söz bankı
  answer: string; // düzgün tam cümlə
  translation?: string; // azərbaycanca tərcümə (ipucu)
}

// Dinləmə — İngilis mətni səsləndirilir, düzgün variantı seç
export interface ListeningTask extends TaskBase {
  type: "listening";
  audioText: string; // səsləndiriləcək İngilis mətni
  options: string[];
  correctIndex: number;
}

// Cütləri tap — sol sütundakı hər elementi sağdakı qarşılığı ilə birləşdir.
//
// NİYƏ ƏLAVƏ OLUNDU: mövcud beş tipin hamısı OXUMAĞI tələb edir. 1-2-ci sinif
// şagirdi hələ yaxşı oxumur. Cütləşdirmə emoji/rəqəm/qısa sözlə işlədiyi üçün
// oxumadan da həll edilə bilir — uşaq mənanı GÖRÜR, sonra toxunur.
//
// `pairs` sırası DÜZGÜN cavabdır: i-ci sol element i-ci sağ elementə uyğundur.
// Ekranda sağ sütun qarışdırılır (bax MatchPairs komponenti), ona görə məzmun
// müəllifi cütləri sadəcə düzgün sıra ilə yazır.
export interface MatchPairsTask extends TaskBase {
  type: "match_pairs";
  pairs: { left: string; right: string }[];
}

export type Task =
  | MatchPairsTask
  | MultipleChoiceTask
  | FillBlankTask
  | NumericTask
  | WordOrderTask
  | ListeningTask;

// Layihə (project) səhifəsindəki qayda bölməsi
export interface RuleSection {
  heading?: string; // qalın alt başlıq
  body: string; // izah mətni (uşaq dilində)
}

// Yolda (path) düyünün növü:
//  • "lesson" — adi dərs (default)
//  • "chest"  — bölmə sandığı: tapşırıq yoxdur, açılanda zümrüd verir
//  • "test"   — bölmə sonu testi: tapşırıqları həmin bölmənin dərslərindən qarışıq yığılır
export type LessonKind = "lesson" | "chest" | "test";

// Lesson = "project": bir mövzu, öz qaydaları, tapşırıqları və son tarixi ilə.
/**
 * Dərs videosu — sofatutor modeli: əvvəl izlə, sonra məşq et.
 *
 * `src` QƏSDƏN sadə URL-dir, host identifikatoru deyil. Hazırda videolar Worker
 * static assets-dən verilir (fayl başına 25 MiB limit → 3-4 dəqiqəlik izah videosu),
 * amma həcm artanda R2-yə və ya xarici axına keçmək lazım gələcək. URL saxladığımıza
 * görə həmin keçid yalnız ünvanı dəyişir — kod və məlumat modeli toxunulmaz qalır.
 *
 * `captions` uşaq məhsulunda vacibdir: səssiz mühitdə izləmək, eşitmə çətinliyi və
 * oxumağı yenicə öyrənən şagird üçün mətnlə səsi eyni vaxtda görmək.
 */
export interface LessonVideo {
  src: string; // MP4/WebM ünvanı (nisbi və ya tam)
  poster?: string; // ilk kadr — yüklənənə qədər göstərilir
  durationSec?: number; // "3 dəq" etiketi üçün; pleyer onsuz da özü bilir
  captions?: string; // .vtt altyazı faylının ünvanı
}

export interface Lesson {
  id: string;
  title: string;
  intro: string; // qısa giriş cümləsi (uşaq dilində, sadə)
  kind?: LessonKind; // yoxdursa "lesson"
  visual?: string; // hero illüstrasiyanın açarı (bax LessonVisual)
  video?: LessonVideo; // varsa giriş ekranında şəkilin yerinə pleyer göstərilir
  sections?: RuleSection[]; // ətraflı qaydalar (şəkil altında)
  tasks: Task[]; // 15 əsas tapşırıq (chest üçün boş, test üçün avtomatik doldurulur)
  bonusTasks?: Task[]; // 5 bonus tapşırıq
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Subject {
  slug: string; // URL-də istifadə olunur, məs. "riyaziyyat"
  name: string;
  grade: number;
  icon: string; // emoji ikon
  color: string; // tailwind rəng sinfi üçün əsas ton, məs. "sky"
  units: Unit[];
}
