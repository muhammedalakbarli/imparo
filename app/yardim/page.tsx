"use client";

// Yardım mərkəzi — kateqoriyalı tez-tez verilən suallar (AZ/EN/RU).

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useOptionalUser } from "@/lib/useOptionalUser";
import { useT, useLang, type Lang } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";

type Category = { title: string; items: { q: string; a: string }[] };

const FAQ: Record<Lang, Category[]> = {
  az: [
    {
      title: "Imparo-dan istifadə",
      items: [
        {
          q: "Necə başlayım?",
          a: "Öyrən bölməsindən bir fənn seç, yoldakı ilk dərsə kliklə və tapşırıqları həll et. Hər dərs bitəndə növbəti açılır.",
        },
        {
          q: "XP nədir?",
          a: "XP hər düzgün cavabda qazandığın xaldır. Bonus tapşırıqlar əlavə XP verir və irəliləyişini göstərir.",
        },
        {
          q: "Gün seriyası (streak) nədir?",
          a: "Hər gün ən azı bir dərs bitirsən, seriyan artır. Bir gün buraxsan sıfırlanır — ona görə hər gün az da olsa məşq et.",
        },
        {
          q: "Dərslər niyə kilidlidir?",
          a: "Dərslər ardıcıldır: əvvəlkini bitirməsən növbəti açılmır. Bu, mövzuları addım-addım, boşluq qoymadan öyrənmək üçündür.",
        },
        {
          q: "Praktika bölməsi nə üçündür?",
          a: "Praktika et bölməsində tamamladığın dərsləri təkrar həll edərək biliyini möhkəmləndirə bilərsən.",
        },
      ],
    },
    {
      title: "Hesab idarəetməsi",
      items: [
        {
          q: "İrəliləyişim harada saxlanılır?",
          a: "Hesabına daxil olduğun üçün irəliləyişin buludda saxlanılır və istənilən cihazda eyni qalır.",
        },
        {
          q: "Adımı və ya emailimi necə dəyişim?",
          a: "Profil → Redaktə bölməsindən adını və profil məlumatlarını dəyişə bilərsən.",
        },
        {
          q: "Bir fənni necə sıfırlayım?",
          a: "Fənnin irəliləyişini sıfırlama funksiyası hazırlanır. Lazımdırsa dəstəklə əlaqə saxla.",
        },
        {
          q: "Hesabıma daxil ola bilmirəm.",
          a: "Email və parolun düzgünlüyünü yoxla. Alınmırsa, Google ilə giriş et və ya yeni hesab yarat.",
        },
        {
          q: "Şifrəmi unutdum, nə edim?",
          a: "Giriş səhifəsindəki «Şifrəni unutmusan?» linkinə bas — e-poçtuna bərpa linki göndəriləcək.",
        },
        {
          q: "Valideynim irəliləyişimi izləyə bilərmi?",
          a: "Bəli, istəsən. Ayarlar → Valideyn hesabatı bölməsinə valideynin e-poçtunu yaz; ona təsdiq məktubu gedir. Təsdiqdən sonra hər bazar günü qısa hesabat alır: nə qədər məşq etdin, hansı fənlərdə irəlilədin, harada çətinlik çəkdin. İstədiyin vaxt silə bilərsən.",
        },
        {
          q: "Hesabımı necə silim?",
          a: "Ayarlar → Məlumatlarım bölməsindən «Hesabımı sil» ilə özün silə bilərsən (məlumatlarını əvvəlcə yükləmək də mümkündür). Problem olsa: destek@imparo.app.",
        },
      ],
    },
    {
      title: "Qiymət",
      items: [
        {
          q: "Imparo pulsuzdur?",
          a: "Bütün dərslər, tapşırıqlar və məşqlər pulsuzdur — kart məlumatı tələb olunmur. Əlavə olaraq könüllü Imparo Plus abunəliyi var (limitsiz can və 2× zümrüd); onsuz da hər şeyi öyrənə bilərsən.",
        },
        {
          q: "Saytda reklam varmı?",
          a: "Xeyr. Uşaqlar üçün təmiz və diqqəti dağıtmayan təcrübə saxlayırıq.",
        },
        {
          q: "Gələcəkdə ödənişli olacaq?",
          a: "Əsas dərslər həmişə pulsuz qalacaq. Ödənişli olan yalnız könüllü Imparo Plus abunəliyidir — o da öyrənməyə deyil, rahatlığa aiddir (limitsiz can, 2× zümrüd).",
        },
      ],
    },
  ],
  en: [
    {
      title: "Using Imparo",
      items: [
        {
          q: "How do I start?",
          a: "Pick a subject in Learn, click the first lesson on the path and solve the tasks. Each finished lesson unlocks the next one.",
        },
        {
          q: "What is XP?",
          a: "XP is the points you earn for each correct answer. Bonus tasks give extra XP and reflect your progress.",
        },
        {
          q: "What is a streak?",
          a: "If you finish at least one lesson every day, your streak grows. Miss a day and it resets — so practice a little every day.",
        },
        {
          q: "Why are lessons locked?",
          a: "Lessons are sequential: the next one opens only after you finish the previous. This lets you learn step by step without gaps.",
        },
        {
          q: "What is the Practice section for?",
          a: "In Practice you can redo lessons you've completed to reinforce your knowledge.",
        },
      ],
    },
    {
      title: "Account management",
      items: [
        {
          q: "Where is my progress saved?",
          a: "Since you're logged in, your progress is stored in the cloud and stays the same on any device.",
        },
        {
          q: "How do I change my name or email?",
          a: "You can change your name and profile details in Profile → Edit.",
        },
        {
          q: "How do I reset a subject?",
          a: "Resetting a subject's progress is being built. If you need it, contact support.",
        },
        {
          q: "I can't log in.",
          a: "Check that your email and password are correct. If it still fails, sign in with Google or create a new account.",
        },
        {
          q: "I forgot my password, what do I do?",
          a: "Click “Forgot your password?” on the login page — a reset link will be sent to your email.",
        },
        {
          q: "Can my parent follow my progress?",
          a: "Yes, if you want. In Settings → Parent report, add your parent's email; they get a confirmation email. After they confirm, they receive a short weekly report: how much you practised, where you improved and where you struggled. You can remove it at any time.",
        },
        {
          q: "How do I delete my account?",
          a: "You can delete it yourself in Settings → My data → “Delete my account” (you can download your data first). If anything goes wrong: destek@imparo.app.",
        },
      ],
    },
    {
      title: "Pricing",
      items: [
        {
          q: "Is Imparo free?",
          a: "All lessons, tasks and practice are free — no card details required. There is also an optional Imparo Plus subscription (unlimited hearts and 2× gems); you can learn everything without it.",
        },
        {
          q: "Are there ads on the site?",
          a: "No. We keep a clean, distraction-free experience for children.",
        },
        {
          q: "Will it be paid in the future?",
          a: "Core lessons will always stay free. The only paid part is the optional Imparo Plus subscription — and it affects comfort, not learning (unlimited hearts, 2× gems).",
        },
      ],
    },
  ],
  ru: [
    {
      title: "Использование Imparo",
      items: [
        {
          q: "С чего начать?",
          a: "Выбери предмет в разделе «Учёба», нажми на первый урок на пути и реши задания. После каждого урока открывается следующий.",
        },
        {
          q: "Что такое XP?",
          a: "XP — это очки за каждый верный ответ. Бонусные задания дают дополнительный XP и отражают твой прогресс.",
        },
        {
          q: "Что такое серия (streak)?",
          a: "Если каждый день проходить хотя бы один урок, серия растёт. Пропустишь день — она обнулится, поэтому занимайся понемногу каждый день.",
        },
        {
          q: "Почему уроки заблокированы?",
          a: "Уроки идут по порядку: следующий открывается только после завершения предыдущего. Так темы изучаются шаг за шагом, без пробелов.",
        },
        {
          q: "Для чего раздел «Практика»?",
          a: "В разделе «Практика» можно заново решать пройденные уроки, чтобы закрепить знания.",
        },
      ],
    },
    {
      title: "Управление аккаунтом",
      items: [
        {
          q: "Где сохраняется мой прогресс?",
          a: "Поскольку ты вошёл в аккаунт, прогресс хранится в облаке и одинаков на любом устройстве.",
        },
        {
          q: "Как изменить имя или email?",
          a: "Имя и данные профиля можно изменить в разделе Профиль → Редактировать.",
        },
        {
          q: "Как сбросить предмет?",
          a: "Сброс прогресса по предмету в разработке. Если нужно — свяжись с поддержкой.",
        },
        {
          q: "Не могу войти в аккаунт.",
          a: "Проверь правильность email и пароля. Если не выходит — войди через Google или создай новый аккаунт.",
        },
        {
          q: "Я забыл пароль, что делать?",
          a: "Нажми «Забыли пароль?» на странице входа — на почту придёт ссылка для сброса.",
        },
        {
          q: "Может ли родитель следить за моим прогрессом?",
          a: "Да, если ты захочешь. В Настройках → Родительский отчёт укажи почту родителя; ему придёт письмо для подтверждения. После подтверждения он раз в неделю получает короткий отчёт: сколько ты занимался, где продвинулся и где были трудности. Удалить можно в любой момент.",
        },
        {
          q: "Как удалить аккаунт?",
          a: "Удалить можно самому: Настройки → Мои данные → «Удалить аккаунт» (сначала можно скачать свои данные). Если не получится: destek@imparo.app.",
        },
      ],
    },
    {
      title: "Цена",
      items: [
        {
          q: "Imparo бесплатный?",
          a: "Все уроки, задания и практика бесплатны — данные карты не нужны. Дополнительно есть необязательная подписка Imparo Plus (безлимитные жизни и 2× изумрудов); без неё доступно всё обучение.",
        },
        {
          q: "Есть ли реклама на сайте?",
          a: "Нет. Мы сохраняем чистый и не отвлекающий опыт для детей.",
        },
        {
          q: "Станет ли платным в будущем?",
          a: "Основные уроки всегда останутся бесплатными. Платная — только необязательная подписка Imparo Plus, и она про удобство, а не про обучение (безлимитные жизни, 2× изумрудов).",
        },
      ],
    },
  ],
};

export default function HelpPage() {
  const { ready } = useOptionalUser();
  const [open, setOpen] = useState<string | null>("0-0");
  const t = useT();
  const lang = useLang();

  if (!ready) return <PageSkeleton />;

  const categories = FAQ[lang];

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-fg">{t("nav.help")}</h1>
        <p className="mt-1 text-sm text-muted">{t("help.faq")}</p>

        {categories.map((cat, ci) => (
          <section key={ci} className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
              {cat.title}
            </h2>
            <div className="mt-2 space-y-3">
              {cat.items.map((item, ii) => {
                const key = `${ci}-${ii}`;
                const isOpen = open === key;
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-2xl border border-line bg-panel"
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <span className="font-bold text-fg">{item.q}</span>
                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-muted transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-4 leading-relaxed text-muted">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Hələ də sualın var? */}
        <div className="mt-10 rounded-2xl border border-line bg-panel p-6 text-center">
          <h2 className="text-lg font-extrabold text-fg">{t("help.stillQ")}</h2>
          <p className="mt-1 text-sm text-muted">{t("help.stillDesc")}</p>
          <a
            href="mailto:destek@imparo.app"
            className="mt-4 inline-block rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            {t("help.writeUs")}
          </a>
        </div>
      </main>
    </div>
  );
}
