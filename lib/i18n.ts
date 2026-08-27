"use client";

// Sadə i18n: AZ/EN/RU lüğət + hydration-təhlükəsiz useT hook.
// Dil `imparo-prefs` (localStorage) içində saxlanılır; dəyişəndə səhifə yenilənir.
// Qeyd: dərs məzmunu (suallar/variantlar) AZ kurikulumu olduğu üçün AZ qalır.

import { useSyncExternalStore } from "react";
import type { Lang } from "./prefs";

export type { Lang };

export const LANG_NAMES: Record<Lang, string> = {
  az: "Azərbaycan dili",
  en: "English",
  ru: "Русский",
};

type Dict = Record<string, Record<Lang, string>>;

const DICT: Dict = {
  // Naviqasiya (sidebar) — bütün səhifələrdə görünür
  "nav.learn": { az: "Öyrən", en: "Learn", ru: "Учёба" },
  "nav.practice": { az: "Praktika et", en: "Practice", ru: "Практика" },
  "nav.league": { az: "Liqa", en: "League", ru: "Лига" },
  "nav.quests": { az: "Görevlər", en: "Quests", ru: "Задания" },
  "nav.shop": { az: "Mağaza", en: "Shop", ru: "Магазин" },
  "nav.schools": { az: "Məktəb", en: "Schools", ru: "Школа" },
  "nav.profile": { az: "Profil", en: "Profile", ru: "Профиль" },
  "nav.more": { az: "Daha çoxu", en: "More", ru: "Ещё" },

  // ── Mağaza ──
  "shop.title": { az: "Mağaza", en: "Shop", ru: "Магазин" },
  "shop.subtitle": {
    az: "Zümrüdlərini xərclə — canını doldur, seriyanı qoru.",
    en: "Spend your gems — refill hearts, protect your streak.",
    ru: "Трать кристаллы — восстанови жизни, защити серию.",
  },
  "shop.balance": { az: "Zümrüd balansın", en: "Your gems", ru: "Твои кристаллы" },
  "shop.refillHearts": { az: "Canları doldur", en: "Refill hearts", ru: "Восстановить жизни" },
  "shop.refillHeartsDesc": { az: "Bütün canları bərpa et", en: "Restore all hearts", ru: "Восстановить все жизни" },
  "shop.buyFreeze": { az: "Seriya qoruyucu", en: "Streak freeze", ru: "Заморозка серии" },
  "shop.buyFreezeDesc": { az: "Bir buraxılmış günü örtür", en: "Covers one missed day", ru: "Покрывает один пропуск" },
  "shop.buy": { az: "Al", en: "Buy", ru: "Купить" },
  "shop.owned": { az: "Alındı!", en: "Purchased!", ru: "Куплено!" },
  "shop.notEnough": { az: "Zümrüd çatmır", en: "Not enough gems", ru: "Недостаточно кристаллов" },
  "shop.full": { az: "Artıq doludur", en: "Already full", ru: "Уже полно" },
  "nav.settings": { az: "Ayarlar", en: "Settings", ru: "Настройки" },
  "nav.help": { az: "Yardım mərkəzi", en: "Help center", ru: "Центр помощи" },
  "nav.logout": { az: "Çıxış", en: "Log out", ru: "Выйти" },

  // Fənn adları (tab-lar, başlıqlar, irəliləyiş)
  "subject.riyaziyyat": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-1": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-1": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-1": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-2": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-2": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-2": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-3": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-3": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-3": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-4": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-4": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-4": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-6": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-6": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-6": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-7": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-7": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-7": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.riyaziyyat-8": { az: "Riyaziyyat", en: "Mathematics", ru: "Математика" },
  "subject.azerbaycan-dili-8": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "subject.ingilis-dili-8": { az: "İngilis dili", en: "English", ru: "Английский" },
  "subject.reqemsal-tehlukesizlik-5": { az: "Rəqəmsal Təhlükəsizlik", en: "Digital Safety", ru: "Цифровая безопасность" },
  "subject.maliyye-savadliligi-5": { az: "Maliyyə Savadlılığı", en: "Financial Literacy", ru: "Финансовая грамотность" },

  // Bölmə (unit) adları — Praktika "Bölmə üzrə" siyahısı
  "unit.ry-natural": {
    az: "Natural ədədlər və onların üzərində əməllər",
    en: "Natural numbers and operations",
    ru: "Натуральные числа и действия",
  },
  "unit.ry-fractions": {
    az: "Kəsrlər (adi kəsrlər)",
    en: "Fractions (common fractions)",
    ru: "Дроби (обыкновенные)",
  },
  "unit.ry-decimals": {
    az: "Onluq kəsrlər",
    en: "Decimals",
    ru: "Десятичные дроби",
  },
  "unit.ry-percent": {
    az: "Faiz, nisbət və tənasüb",
    en: "Percentages, ratio and proportion",
    ru: "Проценты, отношение и пропорция",
  },
  "unit.ry-geometry": {
    az: "Həndəsə elementləri və ölçü vahidləri",
    en: "Geometry elements and units of measurement",
    ru: "Элементы геометрии и единицы измерения",
  },
  "unit.ry-data": {
    az: "Məlumatların təqdim olunması və ehtimal",
    en: "Data presentation and probability",
    ru: "Представление данных и вероятность",
  },
  "unit.ry-divis": {
    az: "Bölünmə əlamətləri və ədədlər",
    en: "Divisibility rules and numbers",
    ru: "Признаки делимости и числа",
  },
  "unit.az-parts-of-speech": {
    az: "Nitq hissələri",
    en: "Parts of speech",
    ru: "Части речи",
  },
  "unit.az-grammar": {
    az: "Dil qaydaları (Qrammatika)",
    en: "Language rules (Grammar)",
    ru: "Правила языка (Грамматика)",
  },
  "unit.az-writing": {
    az: "Yazı və oxu mədəniyyəti",
    en: "Writing and reading culture",
    ru: "Культура письма и чтения",
  },
  "unit.az-speech": {
    az: "Nitq bacarıqlarının inkişafı",
    en: "Developing speech skills",
    ru: "Развитие речевых навыков",
  },
  "unit.en-grammar": {
    az: "Qrammatika — Zamanlar və cümlə",
    en: "Grammar — Tenses and sentences",
    ru: "Грамматика — времена и предложения",
  },
  "unit.en-nouns": {
    az: "İsimlər (Nouns)",
    en: "Nouns",
    ru: "Существительные (Nouns)",
  },
  "unit.en-vocab": {
    az: "Söz ehtiyatı (Vocabulary)",
    en: "Vocabulary",
    ru: "Словарный запас (Vocabulary)",
  },
  "unit.en-skills": {
    az: "Bacarıqlar (Skills)",
    en: "Skills",
    ru: "Навыки (Skills)",
  },
  "unit.ds5-sexsi-melumat": {
    az: "Şəxsi məlumatını qoru",
    en: "Protect your personal information",
    ru: "Защити свои личные данные",
  },
  "unit.ds5-parollar": {
    az: "Güclü parollar və hesab təhlükəsizliyi",
    en: "Strong passwords and account safety",
    ru: "Надёжные пароли и безопасность аккаунта",
  },
  "unit.ds5-kiberbulli": {
    az: "Kiberbulli və fişinqi tanı",
    en: "Recognize cyberbullying and phishing",
    ru: "Распознавай кибербуллинг и фишинг",
  },

  // Yardım mərkəzi (səhifə çərçivəsi; suallar səhifədə dilə görə saxlanılır)
  "help.faq": {
    az: "Tez-tez verilən suallar",
    en: "Frequently asked questions",
    ru: "Часто задаваемые вопросы",
  },
  "help.stillQ": {
    az: "Hələ də sualın var?",
    en: "Still have questions?",
    ru: "Остались вопросы?",
  },
  "help.stillDesc": {
    az: "Cavabı tapmadınsa, birbaşa bizə yaz.",
    en: "If you didn't find the answer, write to us directly.",
    ru: "Если не нашёл ответ, напиши нам напрямую.",
  },
  "help.writeUs": { az: "Bizə yaz", en: "Write to us", ru: "Напиши нам" },

  // Daha çoxu səhifəsi
  "more.subjects": { az: "Fənlər", en: "Subjects", ru: "Предметы" },
  "more.account": { az: "Hesab", en: "Account", ru: "Аккаунт" },
  "more.config": { az: "Tənzimləmə", en: "Settings", ru: "Настройки" },
  "more.tagline": {
    az: "Azərbaycan məktəbliləri üçün interaktiv öyrənmə platforması",
    en: "Interactive learning platform for students in Azerbaijan",
    ru: "Интерактивная платформа обучения для школьников Азербайджана",
  },

  // Həftəlik liqa
  "league.title": { az: "Liqa", en: "Leaderboard", ru: "Рейтинг" },
  "league.subtitle": {
    az: "Ən çox XP toplayanlar",
    en: "Top XP earners",
    ru: "Лидеры по XP",
  },
  "league.overall": {
    az: "Ümumi sıralama · bütün istifadəçilər",
    en: "Overall ranking · all users",
    ru: "Общий рейтинг · все пользователи",
  },
  "league.empty": {
    az: "Bu həftə hələ heç kim XP qazanmayıb — birinci ol!",
    en: "No XP earned this week yet — be the first!",
    ru: "На этой неделе ещё нет XP — стань первым!",
  },
  "league.you": { az: "Sən", en: "You", ru: "Ты" },
  "league.thisWeek": { az: "Bu həftə", en: "This week", ru: "На этой неделе" },
  "league.needXp": {
    az: "Bu həftə hələ XP qazanmamısan. Liqaya qatılmaq üçün ən azı bir dərs et!",
    en: "You haven't earned any XP this week. Do at least one lesson to join the league!",
    ru: "На этой неделе ты ещё не заработал XP. Пройди хотя бы один урок, чтобы попасть в лигу!",
  },
  "league.needXpCta": { az: "Dərsə keç", en: "Go to lessons", ru: "К урокам" },
  "league.tier.bronze": { az: "Bürünc liqa", en: "Bronze league", ru: "Бронзовая лига" },
  "league.tier.silver": { az: "Gümüş liqa", en: "Silver league", ru: "Серебряная лига" },
  "league.tier.gold": { az: "Qızıl liqa", en: "Gold league", ru: "Золотая лига" },
  "league.tier.platinum": { az: "Platin liqa", en: "Platinum league", ru: "Платиновая лига" },
  "league.tier.diamond": { az: "Almaz liqa", en: "Diamond league", ru: "Алмазная лига" },
  "league.compete": {
    az: "Bu həftə top 5 növbəti liqaya keçir",
    en: "Top 5 advance to the next league this week",
    ru: "Топ-5 проходят в следующую лигу на этой неделе",
  },
  "league.promoZone": { az: "Yüksəliş zonası", en: "Promotion zone", ru: "Зона повышения" },
  "league.demoZone": { az: "Enmə zonası", en: "Demotion zone", ru: "Зона понижения" },
  "league.endsIn": { az: "Bitməsinə", en: "Ends in", ru: "До конца" },
  "league.dayShort": { az: "g", en: "d", ru: "д" },
  "league.hourShort": { az: "s", en: "h", ru: "ч" },
  "league.minShort": { az: "dəq", en: "m", ru: "м" },

  // Səviyyə (level)
  "level.label": { az: "Səviyyə", en: "Level", ru: "Уровень" },
  "level.beginner": { az: "Başlanğıc", en: "Beginner", ru: "Новичок" },
  "level.explorer": { az: "Kəşfiyyatçı", en: "Explorer", ru: "Исследователь" },
  "level.knower": { az: "Bilici", en: "Scholar", ru: "Знаток" },
  "level.master": { az: "Usta", en: "Master", ru: "Мастер" },
  "level.legend": { az: "Əfsanə", en: "Legend", ru: "Легенда" },

  // Gündəlik questlər ({n} → hədəf)
  "quest.title": { az: "Gündəlik hədəflər", en: "Daily goals", ru: "Ежедневные цели" },
  "quest.xp": { az: "{n} XP qazan", en: "Earn {n} XP", ru: "Заработай {n} XP" },
  "quest.correct": {
    az: "{n} düzgün cavab",
    en: "{n} correct answers",
    ru: "{n} верных ответов",
  },
  "quest.lessons": { az: "{n} dərs bitir", en: "Finish {n} lessons", ru: "Заверши {n} уроков" },
  "chest.title": { az: "Gündəlik sandıq", en: "Daily chest", ru: "Ежедневный сундук" },
  "chest.wonHearts": { az: "Canlar doldu!", en: "Hearts refilled!", ru: "Жизни восстановлены!" },
  "chest.wonFreeze": { az: "Seriya qoruyucu!", en: "Streak freeze!", ru: "Заморозка серии!" },
  "chest.ready": {
    az: "Bütün gündəlik görevləri bitirdin! Sandığı aç.",
    en: "You finished all daily goals! Open the chest.",
    ru: "Ты выполнил все дневные цели! Открой сундук.",
  },
  "chest.readyShort": { az: "Sandıq hazır!", en: "Chest ready!", ru: "Сундук готов!" },
  "chest.unitTitle": { az: "Bölmə sandığı", en: "Unit chest", ru: "Сундук раздела" },
  "chest.unitReady": {
    az: "Bu bölmənin yarısını bitirdin — mükafatını al!",
    en: "You finished half of this unit — claim your reward!",
    ru: "Вы прошли половину раздела — заберите награду!",
  },
  "chest.open": { az: "Aç", en: "Open", ru: "Открыть" },
  "chest.reward": { az: "Təbriklər! Mükafatın:", en: "Congrats! Your reward:", ru: "Поздравляем! Твоя награда:" },
  "common.ok": { az: "Al", en: "Claim", ru: "Забрать" },
  "common.close": { az: "Bağla", en: "Close", ru: "Закрыть" },
  "quest.allDone": {
    az: "Bütün gündəlik hədəflər tamamlandı!",
    en: "All daily goals done!",
    ru: "Все ежедневные цели выполнены!",
  },

  // Achievements (pilləli nişanlar)
  "ach.title": { az: "Nişanlar", en: "Badges", ru: "Награды" },
  "ach.xp": { az: "XP kolleksiyaçısı", en: "XP collector", ru: "Коллекционер XP" },
  "ach.streak": { az: "Alov", en: "Flame", ru: "Пламя" },
  "ach.lessons": { az: "Zəhmətkeş", en: "Hard worker", ru: "Труженик" },
  "ach.level": { az: "Səviyyə ustası", en: "Level master", ru: "Мастер уровней" },

  // Dərs sonu bayramı (celebration)
  "cel.done": { az: "Dərs tamamlandı!", en: "Lesson complete!", ru: "Урок пройден!" },
  "cel.great": { az: "Əla!", en: "Great!", ru: "Отлично!" },
  "cel.answerWas": { az: "Düzgün cavab:", en: "Correct answer:", ru: "Правильный ответ:" },
  "cel.xp": { az: "Qazanılan XP", en: "XP earned", ru: "Заработано XP" },
  "cel.accuracy": { az: "Dəqiqlik", en: "Accuracy", ru: "Точность" },
  "cel.combo": { az: "Ən yaxşı seriya", en: "Best combo", ru: "Лучшее комбо" },
  "cel.levelUp": { az: "Yeni səviyyə!", en: "Level up!", ru: "Новый уровень!" },
  "cel.perfect": { az: "Qüsursuz dərs!", en: "Perfect lesson!", ru: "Идеальный урок!" },

  // Dərs axını (runner chrome)
  "run.check": { az: "Yoxla", en: "Check", ru: "Проверить" },
  "run.next": { az: "Növbəti", en: "Next", ru: "Далее" },
  "run.continue": { az: "Davam et", en: "Continue", ru: "Продолжить" },
  "run.finish": { az: "Bitir", en: "Finish", ru: "Готово" },
  "run.task": { az: "Tapşırıq", en: "Task", ru: "Задание" },
  "run.bonus": { az: "Bonus", en: "Bonus", ru: "Бонус" },
  "run.retry": { az: "Təkrar", en: "Retry", ru: "Повтор" },
  "run.correct": { az: "Doğru! Afərin.", en: "Correct! Well done.", ru: "Верно! Молодец." },
  "run.wrong": {
    az: "Səhv. Növbəti dəfə alınacaq!",
    en: "Wrong. You'll get it next time!",
    ru: "Неверно. В следующий раз получится!",
  },
  "run.mainDone": {
    az: "Əsas hissə bitdi!",
    en: "Main part done!",
    ru: "Основная часть пройдена!",
  },
  "run.earnedSoFar": {
    az: "İndiyə qədər {n} XP qazandın.",
    en: "You've earned {n} XP so far.",
    ru: "Ты заработал {n} XP.",
  },
  "run.bonusOffer": {
    az: "{n} bonus sual var — əlavə XP qazanmaq istəyirsən?",
    en: "There are {n} bonus questions — want extra XP?",
    ru: "Есть {n} бонусных вопросов — хочешь дополнительный XP?",
  },
  "run.startBonus": { az: "Bonusa başla", en: "Start bonus", ru: "Начать бонус" },
  "run.backToPath": { az: "Yola qayıt", en: "Back to path", ru: "Вернуться к пути" },
  "run.home": { az: "Ana səhifə", en: "Home", ru: "Главная" },
  "run.noTasks": {
    az: "Bu dərs üçün hələ tapşırıq əlavə edilməyib.",
    en: "No tasks yet for this lesson.",
    ru: "Для этого урока пока нет заданий.",
  },

  // Ortaq statistikalar
  "stat.xp": { az: "XP", en: "XP", ru: "XP" },
  "stat.hearts": { az: "can", en: "hearts", ru: "жизни" },
  "stat.gems": { az: "zümrüd", en: "gems", ru: "кристаллы" },
  "stat.streak": { az: "gün seriya", en: "day streak", ru: "дней подряд" },
  "stat.completed": { az: "tamamlandı", en: "completed", ru: "завершено" },

  // Öyrən (dashboard)
  "dash.title": { az: "Öyrən", en: "Learn", ru: "Учёба" },
  "dash.greeting": { az: "Salam", en: "Hi", ru: "Привет" },
  "hearts.outTitle": { az: "Canların bitdi!", en: "Out of hearts!", ru: "Жизни закончились!" },
  "hearts.outBody": {
    az: "Canlar zamanla bərpa olunur. Praktika edərək məşq et və ya davam et.",
    en: "Hearts refill over time. Practice to warm up, or keep going.",
    ru: "Жизни восстанавливаются со временем. Потренируйся или продолжай.",
  },
  "hearts.practice": { az: "Praktika et", en: "Practice", ru: "Практика" },
  "hearts.continue": { az: "Davam et", en: "Keep going", ru: "Продолжить" },
  "dash.gradeSoonTitle": { az: "Tezliklə!", en: "Coming soon!", ru: "Скоро!" },
  "dash.gradeSoon": {
    az: "{n}-ci sinif proqramı hazırlanır. Ayarlardan sinfini dəyişə bilərsən.",
    en: "The grade {n} program is being prepared. You can change your grade in settings.",
    ru: "Программа {n} класса готовится. Класс можно изменить в настройках.",
  },
  "dash.changeGrade": { az: "Sinfi dəyiş", en: "Change grade", ru: "Изменить класс" },
  "dash.continue": { az: "davam edək", en: "let's continue", ru: "продолжим" },
  "dash.dailyBanner": {
    az: "Gündəlik challenge səni gözləyir — 5 tapşırıq",
    en: "Your daily challenge awaits — 5 tasks",
    ru: "Тебя ждёт ежедневный челлендж — 5 заданий",
  },
  "dash.start": { az: "Başla", en: "Start", ru: "Начать" },
  "path.locked": { az: "Kilidli", en: "Locked", ru: "Закрыто" },
  "dash.next": { az: "Növbəti", en: "Next", ru: "Далее" },
  "dash.leagueHint": { az: "Reytinqinə bax", en: "See your ranking", ru: "Посмотреть рейтинг" },
  "dash.allDone": {
    az: "Bütün dərslər bitdi!",
    en: "All lessons complete!",
    ru: "Все уроки пройдены!",
  },
  "dash.resume": { az: "Davam et", en: "Continue", ru: "Продолжить" },

  // Praktika
  "practice.title": { az: "Praktika et", en: "Practice", ru: "Практика" },
  "practice.subtitle": {
    az: "Biliyini möhkəmləndir — səhvlərini düzəlt, təkrar et, yarış.",
    en: "Sharpen your skills — fix mistakes, review, compete.",
    ru: "Закрепи знания — исправь ошибки, повтори, соревнуйся.",
  },
  "practice.daily": { az: "Gündəlik challenge", en: "Daily challenge", ru: "Ежедневный челлендж" },
  "practice.dailyDone": {
    az: "Bu gün tamamlandı — sabah yenə!",
    en: "Done for today — come back tomorrow!",
    ru: "На сегодня всё — до завтра!",
  },
  "practice.dailyDesc": {
    az: "5 tapşırıq həll et, formada qal.",
    en: "Solve 5 tasks, stay in shape.",
    ru: "Реши 5 заданий, будь в форме.",
  },
  "practice.mistakes": { az: "Təkrar vaxtıdır", en: "Time to review", ru: "Пора повторить" },
  "practice.mixed": { az: "Qarışıq praktika", en: "Mixed practice", ru: "Смешанная практика" },
  "practice.mixedDesc": {
    az: "Tamamladığın dərslərdən 10 təsadüfi tapşırıq",
    en: "10 random tasks from lessons you've completed",
    ru: "10 случайных заданий из пройденных уроков",
  },
  "practice.speed": { az: "Sürət raundu", en: "Speed round", ru: "Скоростной раунд" },
  "practice.speedDesc": {
    az: "60 saniyədə neçə düzgün cavab?",
    en: "How many correct in 60 seconds?",
    ru: "Сколько верных за 60 секунд?",
  },
  "practice.byUnit": { az: "Bölmə üzrə praktika", en: "Practice by unit", ru: "Практика по разделам" },
  "practice.tasks": { az: "tapşırıq", en: "tasks", ru: "заданий" },
  "practice.noMistakes": { az: "Təkrar yoxdur — əla!", en: "Nothing to review — great!", ru: "Нечего повторять — отлично!" },
  "practice.adaptive": { az: "Zəif bacarıqlar", en: "Weak skills", ru: "Слабые навыки" },
  "practice.adaptiveDesc": {
    az: "Ən çətin gələn bacarıq üzrə fərdi məşq",
    en: "Personalised practice on your weakest skill",
    ru: "Персональная практика по самому слабому навыку",
  },
  "practice.adaptiveNone": {
    az: "Bir neçə dərs həll et — zəif tərəfin müəyyən olunsun",
    en: "Complete a few lessons so we can find your weak spots",
    ru: "Пройдите несколько уроков, чтобы найти слабые места",
  },
  "map.title": { az: "Bilik Xəritəsi", en: "Knowledge Map", ru: "Карта знаний" },
  "map.subtitle": {
    az: "Hansı bacarığı nə qədər mənimsədiyini göstərir",
    en: "Shows how well you have mastered each skill",
    ru: "Показывает, насколько вы освоили каждый навык",
  },
  "map.empty": {
    az: "Hələ məlumat yoxdur. Bir neçə dərs həll et, xəritə dolmağa başlasın.",
    en: "No data yet. Complete a few lessons and the map will fill in.",
    ru: "Пока нет данных. Пройдите несколько уроков, и карта заполнится.",
  },
  "map.attempts": { az: "cəhd", en: "attempts", ru: "попыток" },
  "map.weakest": { az: "Diqqət tələb edir", en: "Needs attention", ru: "Требует внимания" },
  "map.practise": { az: "Bu bacarığı məşq et", en: "Practise this skill", ru: "Тренировать навык" },
  "practice.diagnostic": { az: "Diaqnostika", en: "Diagnostic", ru: "Диагностика" },
  "practice.diagnosticDesc": {
    az: "20 sual — hansı bacarıqda harada olduğunu ölçür",
    en: "20 questions — measures where you stand on each skill",
    ru: "20 вопросов — измеряет ваш уровень по каждому навыку",
  },

  // Profil
  "profile.progress": { az: "Fənlər üzrə irəliləyiş", en: "Progress by subject", ru: "Прогресс по предметам" },
  "profile.badges": { az: "Nişanlar", en: "Badges", ru: "Награды" },
  "profile.badgesHint": {
    az: "İrəlilədikcə yeni nişanlar açılır",
    en: "Unlock new badges as you progress",
    ru: "Открывай новые награды по мере прогресса",
  },
  "profile.logout": { az: "Hesabdan çıx", en: "Log out", ru: "Выйти из аккаунта" },
  "profile.edit": { az: "Profili redaktə et", en: "Edit profile", ru: "Редактировать профиль" },
  "profile.share": { az: "Profili paylaş", en: "Share profile", ru: "Поделиться профилем" },
  "profile.copyLink": { az: "Linki kopyala", en: "Copy link", ru: "Копировать ссылку" },
  "profile.copied": { az: "Kopyalandı!", en: "Copied!", ru: "Скопировано!" },
  "profile.memberSince": { az: "Üzv: {d}", en: "Member since {d}", ru: "С нами с {d}" },
  "profile.name": { az: "Ad", en: "Name", ru: "Имя" },
  "profile.username": { az: "İstifadəçi adı", en: "Username", ru: "Имя пользователя" },
  "profile.avatar": { az: "Avatar", en: "Avatar", ru: "Аватар" },
  "profile.save": { az: "Yadda saxla", en: "Save", ru: "Сохранить" },
  "profile.saved": { az: "Yadda saxlanıldı", en: "Saved", ru: "Сохранено" },
  "profile.usernameTaken": {
    az: "Bu istifadəçi adı tutulub",
    en: "This username is taken",
    ru: "Это имя пользователя занято",
  },
  "profile.usernameHint": {
    az: "3-20 simvol: kiçik hərf, rəqəm, alt xətt (_)",
    en: "3-20 chars: lowercase, digits, underscore (_)",
    ru: "3-20 симв.: строчные, цифры, подчёркивание (_)",
  },
  "profile.monthly": { az: "Bu ayın nişanı", en: "This month's badge", ru: "Значок месяца" },
  "profile.back": { az: "Geri", en: "Back", ru: "Назад" },
  "profile.notFound": {
    az: "Belə profil tapılmadı",
    en: "Profile not found",
    ru: "Профиль не найден",
  },

  // Dostlar
  "friends.title": { az: "Dostlar", en: "Friends", ru: "Друзья" },
  "friends.invite": { az: "Dostunu dəvət et", en: "Invite a friend", ru: "Пригласи друга" },
  "friends.none": {
    az: "Hələ dostun yoxdur — dəvət et!",
    en: "No friends yet — invite one!",
    ru: "Пока нет друзей — пригласи!",
  },
  "friends.add": { az: "Dost əlavə et", en: "Add friend", ru: "Добавить друга" },
  "friends.added": { az: "Dost əlavə olundu!", en: "Friend added!", ru: "Друг добавлен!" },
  "friends.friendStreak": { az: "birgə seriya", en: "friend streak", ru: "совместная серия" },
  "friends.inviteText": {
    az: "{n} səni dost olmağa dəvət edir",
    en: "{n} invites you to be friends",
    ru: "{n} приглашает вас в друзья",
  },
  "friends.loginToAdd": {
    az: "Dost olmaq üçün giriş et",
    en: "Log in to add as a friend",
    ru: "Войди, чтобы добавить в друзья",
  },
  "friends.login": { az: "Giriş et", en: "Log in", ru: "Войти" },
  "friends.ownLink": {
    az: "Bu sənin öz dəvət linkindir",
    en: "This is your own invite link",
    ru: "Это твоя ссылка-приглашение",
  },
  "friends.toProfile": { az: "Profilə keç", en: "Go to profile", ru: "В профиль" },
  "friends.already": { az: "Dostunuz", en: "Your friend", ru: "В друзьях" },
  "follow.follow": { az: "İzlə", en: "Follow", ru: "Подписаться" },
  "follow.following": { az: "İzlənilir", en: "Following", ru: "Вы подписаны" },
  "follow.followers": { az: "izləyici", en: "followers", ru: "подписчиков" },
  "follow.followingCount": { az: "izlənilən", en: "following", ru: "подписки" },

  // Ayarlar
  "settings.title": { az: "Ayarlar", en: "Settings", ru: "Настройки" },
  "settings.subtitle": { az: "Tərcihlər", en: "Preferences", ru: "Предпочтения" },
  "settings.lessonExp": { az: "Dərs təcrübəsi", en: "Lesson experience", ru: "Опыт уроков" },
  "settings.sound": { az: "Səs effektləri", en: "Sound effects", ru: "Звуковые эффекты" },
  "settings.soundHint": {
    az: "Cavab və təbriklərdə səslər",
    en: "Sounds on answers and praise",
    ru: "Звуки при ответах и похвале",
  },
  "settings.animations": { az: "Animasiyalar", en: "Animations", ru: "Анимации" },
  "settings.animationsHint": {
    az: "Zefi və keçid animasiyaları",
    en: "Zefi and transition animations",
    ru: "Анимации Зефи и переходов",
  },
  "settings.motivational": { az: "Motivasiya mesajları", en: "Motivational messages", ru: "Мотивационные сообщения" },
  "settings.motivationalHint": {
    az: "Ruhlandırıcı bildirişlər",
    en: "Encouraging notifications",
    ru: "Ободряющие уведомления",
  },
  "settings.listening": { az: "Dinləmə çalışmaları", en: "Listening exercises", ru: "Аудирование" },
  "settings.listeningHint": { az: "Səsli tapşırıqlar", en: "Audio tasks", ru: "Аудиозадания" },
  "settings.notifSection": { az: "Bildirişlər", en: "Notifications", ru: "Уведомления" },
  "settings.notifications": { az: "Xatırlatmalar", en: "Reminders", ru: "Напоминания" },
  "settings.notificationsHint": {
    az: "Streak-in yanmasın deyə gündəlik xatırlatma göndərək",
    en: "We'll send a daily reminder so your streak doesn't break",
    ru: "Отправим ежедневное напоминание, чтобы не сгорел стрик",
  },
  "settings.notifDenied": {
    az: "Bildirişlər brauzerdə bloklanıb — brauzer ayarlarından icazə ver",
    en: "Notifications are blocked in your browser — allow them in browser settings",
    ru: "Уведомления заблокированы в браузере — разрешите их в настройках",
  },
  "settings.notifUnsupported": {
    az: "Bu brauzer bildirişləri dəstəkləmir",
    en: "This browser does not support notifications",
    ru: "Этот браузер не поддерживает уведомления",
  },
  "settings.notifError": {
    az: "Alınmadı, bir az sonra yenidən yoxla",
    en: "Something went wrong, try again later",
    ru: "Не удалось, попробуйте позже",
  },
  "settings.gradeSection": { az: "Sinif", en: "Grade", ru: "Класс" },
  "settings.grade": { az: "Sinfin", en: "Your grade", ru: "Твой класс" },
  "settings.gradeHint": {
    az: "Proqram seçdiyin sinfə görə göstərilir",
    en: "Content is shown based on your grade",
    ru: "Контент показывается по твоему классу",
  },
  "settings.gradeOption": { az: "{n}-ci sinif", en: "Grade {n}", ru: "{n} класс" },
  "settings.appearance": { az: "Görünüş", en: "Appearance", ru: "Внешний вид" },
  "settings.dark": { az: "Tünd rejim", en: "Dark mode", ru: "Тёмная тема" },
  "settings.darkHint": {
    az: "Gecə üçün rahat görünüş",
    en: "Comfortable look for night",
    ru: "Комфортный вид для ночи",
  },
  "settings.system": { az: "Sistem default", en: "System default", ru: "Как в системе" },
  "settings.light": { az: "İşıqlı", en: "Light", ru: "Светлая" },
  "settings.darkOpt": { az: "Tünd", en: "Dark", ru: "Тёмная" },
  "settings.language": { az: "Dil", en: "Language", ru: "Язык" },
  "settings.languageHint": {
    az: "İnterfeys dili",
    en: "Interface language",
    ru: "Язык интерфейса",
  },

  // ── Ayarlar → Məlumatlarım (özünə-xidmət məxfilik hüquqları) ──
  "settings.privacy": { az: "Məlumatlarım", en: "My data", ru: "Мои данные" },
  "settings.exportData": { az: "Məlumatlarımı yüklə", en: "Download my data", ru: "Скачать мои данные" },
  "settings.exportDataHint": {
    az: "Haqqında saxlanılan bütün məlumatın JSON çıxarışı",
    en: "A JSON export of everything stored about you",
    ru: "JSON-экспорт всех данных о вас",
  },
  "settings.deleteAccount": { az: "Hesabımı sil", en: "Delete my account", ru: "Удалить аккаунт" },
  "settings.deleteAccountHint": {
    az: "Bütün məlumatın həmişəlik silinir — geri qaytarıla bilməz",
    en: "All your data is permanently deleted — cannot be undone",
    ru: "Все данные удаляются навсегда — отменить нельзя",
  },
  "settings.deleteAccountConfirm": {
    az: "Əminsən? Bunu yazaraq təsdiqlə:",
    en: "Are you sure? Type this to confirm:",
    ru: "Вы уверены? Введите для подтверждения:",
  },
  "settings.deleteAccountCancel": { az: "Ləğv et", en: "Cancel", ru: "Отмена" },
  "settings.deleteAccountFinal": { az: "Bəli, həmişəlik sil", en: "Yes, delete forever", ru: "Да, удалить навсегда" },

  // ── Landing (ana səhifə) ──
  "home.login": { az: "Daxil ol", en: "Sign in", ru: "Войти" },
  "home.badge": {
    az: "Azərbaycan məktəbliləri üçün · 1–8-ci siniflər",
    en: "For Azerbaijani students · grades 1–8",
    ru: "Для школьников Азербайджана · 1–8 классы",
  },
  "home.hero1": { az: "Öyrənməyi ", en: "Make learning ", ru: "Преврати учёбу в " },
  "home.hero2": { az: "əyləncəyə", en: "fun", ru: "игру" },
  "home.hero3": { az: " çevir", en: "", ru: "" },
  "home.heroBody": {
    az: "Riyaziyyat, Azərbaycan dili və İngilis dilini addım-addım, oyun kimi öyrən. Pulsuz, sadə və maraqlı.",
    en: "Learn Math, Azerbaijani and English step by step, like a game. Free, simple and fun.",
    ru: "Учите математику, азербайджанский и английский шаг за шагом, как в игре. Бесплатно, просто и увлекательно.",
  },
  "home.ctaStart": { az: "Pulsuz başla", en: "Start free", ru: "Начать бесплатно" },
  "home.haveAccount": {
    az: "Artıq hesabım var",
    en: "I already have an account",
    ru: "У меня уже есть аккаунт",
  },
  "home.aferin": { az: "Afərin!", en: "Well done!", ru: "Молодец!" },
  "home.stat.subjects": { az: "fənn", en: "subjects", ru: "предметы" },
  "home.stat.lessons": { az: "dərs", en: "lessons", ru: "уроки" },
  "home.stat.tasks": { az: "tapşırıq", en: "tasks", ru: "задания" },
  "home.streakBadge": { az: "Seriya 5", en: "Streak 5", ru: "Серия 5" },

  "home.r1.tag": { az: "Oyun kimi", en: "Like a game", ru: "Как игра" },
  "home.r1.title": {
    az: "Öyrənmək əyləncəli olsun",
    en: "Make learning enjoyable",
    ru: "Пусть учёба будет в удовольствие",
  },
  "home.r1.body": {
    az: "Hər düzgün cavabda XP qazan, seriyanı qoru, dərsləri tamamla. Zefi səni hər addımda ruhlandırır.",
    en: "Earn XP for every correct answer, keep your streak, complete lessons. Zefi cheers you on at every step.",
    ru: "Получай XP за каждый правильный ответ, береги серию, завершай уроки. Зефи подбадривает тебя на каждом шагу.",
  },
  "home.r2.tag": { az: "Öz sürətinlə", en: "At your own pace", ru: "В своём темпе" },
  "home.r2.title": {
    az: "Addım-addım, tələsmədən",
    en: "Step by step, no rush",
    ru: "Шаг за шагом, без спешки",
  },
  "home.r2.body": {
    az: "Hər dərs bitəndə növbəti açılır. Öz tempinlə irəlilə — irəliləyişin avtomatik yadda qalır.",
    en: "Each lesson unlocks the next. Move at your own pace — your progress is saved automatically.",
    ru: "Каждый урок открывает следующий. Двигайся в своём темпе — прогресс сохраняется автоматически.",
  },
  "home.r3.tag": { az: "Məktəb proqramı", en: "School curriculum", ru: "Школьная программа" },
  "home.r3.title": {
    az: "3 fənn, real kurikulum",
    en: "3 subjects, real curriculum",
    ru: "3 предмета, реальная программа",
  },
  "home.r3.body": {
    az: "1–8-ci sinif proqramına uyğun: hər mövzu izah + tapşırıqlarla. Riyaziyyat, Azərbaycan dili və İngilis dili.",
    en: "Aligned with the grade 1–8 program: each topic with an explanation + exercises. Math, Azerbaijani and English.",
    ru: "По программе 1–8 классов: каждая тема с объяснением и заданиями. Математика, азербайджанский и английский.",
  },
  "home.finalTitle": {
    az: "Bu gün öyrənməyə başla",
    en: "Start learning today",
    ru: "Начните учиться сегодня",
  },
  "home.finalBody": {
    az: "Hesab yarat, ilk dərsini bitir və XP qazan. Tamamilə pulsuz.",
    en: "Create an account, finish your first lesson and earn XP. Completely free.",
    ru: "Создайте аккаунт, завершите первый урок и получите XP. Совершенно бесплатно.",
  },

  // ── Landing: fənn vitrini ──
  "home.subjects.grade": { az: "ci sinif", en: "grade", ru: "класс" },
  "home.subjects.title": {
    az: "Üç fənn, bir yolda",
    en: "Three subjects, one path",
    ru: "Три предмета, один путь",
  },
  "home.subjects.body": {
    az: "Hər fənn kurikuluma uyğun mövzu-mövzu, oyun kimi.",
    en: "Each subject topic by topic, curriculum-aligned, like a game.",
    ru: "Каждый предмет тема за темой, по программе, как игра.",
  },
  "home.subjects.math": { az: "Riyaziyyat", en: "Math", ru: "Математика" },
  "home.subjects.az": { az: "Azərbaycan dili", en: "Azerbaijani", ru: "Азербайджанский" },
  "home.subjects.en": { az: "İngilis dili", en: "English", ru: "Английский" },
  "home.subjects.mathDesc": {
    az: "Saylar, hesab, həndəsə",
    en: "Numbers, arithmetic, geometry",
    ru: "Числа, арифметика, геометрия",
  },
  "home.subjects.azDesc": {
    az: "Qrammatika, oxu, yazı",
    en: "Grammar, reading, writing",
    ru: "Грамматика, чтение, письмо",
  },
  "home.subjects.enDesc": {
    az: "Lüğət, dinləmə, tələffüz",
    en: "Vocabulary, listening, speaking",
    ru: "Лексика, аудирование, речь",
  },

  // ── Landing: oyunlaşdırma çipləri ──
  "home.feat.title": {
    az: "Öyrənməyi əyləncəyə çevirən hər şey",
    en: "Everything that makes learning fun",
    ru: "Всё, что делает учёбу увлекательной",
  },
  "home.feat.xp": { az: "XP və səviyyələr", en: "XP & levels", ru: "XP и уровни" },
  "home.feat.streak": { az: "Gündəlik seriya", en: "Daily streak", ru: "Ежедневная серия" },
  "home.feat.league": { az: "Həftəlik liqa", en: "Weekly league", ru: "Еженедельная лига" },
  "home.feat.badge": { az: "Nişan və mükafat", en: "Badges & rewards", ru: "Значки и награды" },

  // ── Landing: necə işləyir ──
  "home.app.title": { az: "İstənilən yerdə öyrən", en: "Learn anytime, anywhere", ru: "Учись где угодно" },
  "home.app.body": {
    az: "Imparo brauzerdə işləyir və telefonda tətbiq kimi (PWA) quraşdırıla bilər. Native iOS/Android tətbiqi üzərində işləyirik.",
    en: "Imparo works in the browser and installs as an app on your phone (PWA). Native iOS/Android apps are in development.",
    ru: "Imparo работает в браузере и устанавливается как приложение на телефон (PWA). Нативные приложения iOS/Android в разработке.",
  },
  "home.app.soon": { az: "Tezliklə", en: "Coming soon", ru: "Скоро" },
  "home.how.title": { az: "Necə işləyir?", en: "How it works", ru: "Как это работает" },
  "home.how.s1.t": { az: "Hesab yarat", en: "Create an account", ru: "Создай аккаунт" },
  "home.how.s1.d": {
    az: "Sinfini seç, bir neçə saniyəyə hazırsan.",
    en: "Pick your grade, ready in seconds.",
    ru: "Выбери класс — готово за секунды.",
  },
  "home.how.s2.t": { az: "Hər gün öyrən", en: "Learn every day", ru: "Учись каждый день" },
  "home.how.s2.d": {
    az: "Qısa dərslər, oyun kimi tapşırıqlar.",
    en: "Short lessons, game-like tasks.",
    ru: "Короткие уроки, задания как игра.",
  },
  "home.how.s3.t": { az: "İrəlilə və qazan", en: "Progress & win", ru: "Прогресс и победа" },
  "home.how.s3.d": {
    az: "XP topla, seriyanı qoru, liqada yüksəl.",
    en: "Earn XP, keep your streak, climb the league.",
    ru: "Набирай XP, береги серию, поднимайся в лиге.",
  },

  // ── Giriş / Qeydiyyat (auth) ──
  "auth.or": { az: "və ya", en: "or", ru: "или" },
  "auth.email": { az: "Email", en: "Email", ru: "Эл. почта" },
  "auth.password": { az: "Parol", en: "Password", ru: "Пароль" },
  "auth.checking": { az: "Yoxlanılır...", en: "Checking...", ru: "Проверка..." },
  "auth.homeAria": { az: "Ana səhifə", en: "Home", ru: "Главная" },
  "auth.showPass": { az: "Parolu göstər", en: "Show password", ru: "Показать пароль" },
  "auth.hidePass": { az: "Parolu gizlət", en: "Hide password", ru: "Скрыть пароль" },
  "auth.tagline": {
    az: "Azərbaycan məktəbliləri üçün interaktiv öyrənmə platforması",
    en: "An interactive learning platform for Azerbaijani students",
    ru: "Интерактивная платформа обучения для школьников Азербайджана",
  },
  "common.user": { az: "İstifadəçi", en: "User", ru: "Пользователь" },

  // Giriş
  "auth.login.title": { az: "Xoş gəldin", en: "Welcome back", ru: "С возвращением" },
  "auth.login.subtitle": {
    az: "Davam etmək üçün hesabına daxil ol",
    en: "Sign in to continue",
    ru: "Войдите, чтобы продолжить",
  },
  "auth.login.google": {
    az: "Google ilə daxil ol",
    en: "Continue with Google",
    ru: "Войти через Google",
  },
  "auth.login.submit": { az: "Daxil ol", en: "Sign in", ru: "Войти" },
  "auth.login.passwordPlaceholder": { az: "Parolun", en: "Your password", ru: "Ваш пароль" },
  "auth.login.brandHeading": {
    az: "Öyrənməyə davam et",
    en: "Keep learning",
    ru: "Продолжайте учиться",
  },
  "auth.login.brandSub": {
    az: "Hesabına daxil ol və qaldığın yerdən davam et.",
    en: "Sign in and pick up where you left off.",
    ru: "Войдите и продолжите с того места, где остановились.",
  },
  "auth.login.noAccount": {
    az: "Hesabın yoxdur?",
    en: "Don't have an account?",
    ru: "Нет аккаунта?",
  },
  "auth.login.signupLink": {
    az: "Qeydiyyatdan keç",
    en: "Sign up",
    ru: "Зарегистрироваться",
  },
  "auth.login.perk1": {
    az: "3 fənn üzrə 60+ interaktiv dərs",
    en: "60+ interactive lessons in 3 subjects",
    ru: "60+ интерактивных уроков по 3 предметам",
  },
  "auth.login.perk2": {
    az: "Öz sürətinlə, oyun kimi öyrənmə",
    en: "Learn at your own pace, like a game",
    ru: "Учитесь в своём темпе, как в игре",
  },
  "auth.login.perk3": {
    az: "İrəliləyişin avtomatik yadda saxlanılır",
    en: "Your progress is saved automatically",
    ru: "Ваш прогресс сохраняется автоматически",
  },

  // Qeydiyyat
  "auth.signup.title": {
    az: "Yeni hesab yarat",
    en: "Create your account",
    ru: "Создайте аккаунт",
  },
  "auth.signup.subtitle": {
    az: "Bir neçə saniyə çəkir",
    en: "Takes a few seconds",
    ru: "Займёт несколько секунд",
  },
  "auth.signup.google": {
    az: "Google ilə qeydiyyat",
    en: "Sign up with Google",
    ru: "Регистрация через Google",
  },
  "auth.signup.submit": { az: "Qeydiyyatdan keç", en: "Sign up", ru: "Зарегистрироваться" },
  "auth.signup.guardianConsent": {
    az: "Bu hesabı valideyn/müəllim nəzarəti ilə yaradıram",
    en: "I'm creating this account under parent/teacher supervision",
    ru: "Я создаю этот аккаунт под наблюдением родителя/учителя",
  },
  "auth.signup.parentEmail": {
    az: "Valideyn email-i (könüllü)",
    en: "Parent email (optional)",
    ru: "Email родителя (необязательно)",
  },
  "auth.signup.parentEmailPlaceholder": {
    az: "valideyn@email.com",
    en: "parent@email.com",
    ru: "parent@email.com",
  },
  "auth.err.guardianConsent": {
    az: "Zəhmət olmasa valideyn/müəllim nəzarəti bəndini təsdiqlə",
    en: "Please confirm parent/teacher supervision",
    ru: "Подтвердите наблюдение родителя/учителя",
  },
  "auth.signup.loading": {
    az: "Qeydiyyat aparılır...",
    en: "Signing up...",
    ru: "Регистрация...",
  },
  "auth.signup.brandHeading": {
    az: "Öyrənməyə bu gün başla",
    en: "Start learning today",
    ru: "Начните учиться сегодня",
  },
  "auth.signup.brandSub": {
    az: "Hesab yarat, ilk dərsini bitir və XP qazan.",
    en: "Create an account, finish your first lesson and earn XP.",
    ru: "Создайте аккаунт, завершите первый урок и получите XP.",
  },
  "auth.signup.haveAccount": {
    az: "Artıq hesabın var?",
    en: "Already have an account?",
    ru: "Уже есть аккаунт?",
  },
  "auth.signup.loginLink": { az: "Daxil ol", en: "Sign in", ru: "Войти" },
  "auth.signup.name": { az: "Ad və Soyad", en: "Full name", ru: "Имя и фамилия" },
  "auth.signup.namePlaceholder": {
    az: "Adınız və soyadınız",
    en: "Your first and last name",
    ru: "Ваши имя и фамилия",
  },
  "auth.signup.password": { az: "Şifrə", en: "Password", ru: "Пароль" },
  "auth.signup.passwordPlaceholder": {
    az: "Ən az 6 simvol",
    en: "At least 6 characters",
    ru: "Минимум 6 символов",
  },
  "auth.signup.confirm": {
    az: "Şifrəni təkrar daxil et",
    en: "Confirm password",
    ru: "Повторите пароль",
  },
  "auth.signup.confirmPlaceholder": {
    az: "Şifrəni təkrar yazın",
    en: "Re-enter your password",
    ru: "Введите пароль ещё раз",
  },
  "auth.signup.match": {
    az: "Şifrələr uyğundur",
    en: "Passwords match",
    ru: "Пароли совпадают",
  },
  "auth.signup.perk1": {
    az: "Pulsuz — kart və ödəniş yoxdur",
    en: "Free — no card, no payment",
    ru: "Бесплатно — без карты и оплаты",
  },
  "auth.signup.perk2": {
    az: "3 fənn: Riyaziyyat, Azərbaycan dili, İngilis dili",
    en: "3 subjects: Math, Azerbaijani, English",
    ru: "3 предмета: математика, азербайджанский, английский",
  },
  "auth.signup.perk3": {
    az: "İrəliləyişin hər cihazda yadda qalır",
    en: "Your progress is saved on every device",
    ru: "Ваш прогресс сохраняется на всех устройствах",
  },

  // Şifrə gücü
  "auth.strength.weak": { az: "Zəif", en: "Weak", ru: "Слабый" },
  "auth.strength.fair": { az: "Orta", en: "Fair", ru: "Средний" },
  "auth.strength.good": { az: "Yaxşı", en: "Good", ru: "Хороший" },
  "auth.strength.strong": { az: "Güclü", en: "Strong", ru: "Сильный" },

  // Xətalar
  "auth.err.invalid": {
    az: "Email və ya parol yanlışdır.",
    en: "Email or password is incorrect.",
    ru: "Неверный эл. адрес или пароль.",
  },
  "auth.err.allFields": {
    az: "Bütün sahələri doldurun.",
    en: "Please fill in all fields.",
    ru: "Заполните все поля.",
  },
  "auth.err.passMismatch": {
    az: "Şifrələr uyğun gəlmir.",
    en: "Passwords do not match.",
    ru: "Пароли не совпадают.",
  },
  "auth.err.passShort": {
    az: "Şifrə ən az 6 simvol olmalıdır.",
    en: "Password must be at least 6 characters.",
    ru: "Пароль должен быть не менее 6 символов.",
  },
  "auth.err.signupFailed": {
    az: "Qeydiyyat alınmadı. Yenidən cəhd et.",
    en: "Sign-up failed. Please try again.",
    ru: "Регистрация не удалась. Попробуйте снова.",
  },
  "auth.err.oauth": {
    az: "Google ilə giriş alınmadı. Yenidən cəhd et.",
    en: "Google sign-in failed. Please try again.",
    ru: "Не удалось войти через Google. Попробуйте снова.",
  },

  // ── Parol bərpası ──
  "auth.forgot.link": { az: "Parolunu unutmusan?", en: "Forgot password?", ru: "Забыли пароль?" },
  "auth.forgot.title": { az: "Parolu bərpa et", en: "Reset password", ru: "Сброс пароля" },
  "auth.forgot.subtitle": {
    az: "Email ünvanını yaz — sənə bərpa linki göndərək.",
    en: "Enter your email and we'll send you a reset link.",
    ru: "Введите эл. почту — мы отправим ссылку для сброса.",
  },
  "auth.forgot.submit": { az: "Bərpa linki göndər", en: "Send reset link", ru: "Отправить ссылку" },
  "auth.forgot.sending": { az: "Göndərilir...", en: "Sending...", ru: "Отправка..." },
  "auth.forgot.sent.title": { az: "Emailini yoxla", en: "Check your email", ru: "Проверьте почту" },
  "auth.forgot.sent.body": {
    az: "Əgər bu email ilə hesab varsa, parol bərpası linkini göndərdik. Gələnlər qutusunu (və spam qovluğunu) yoxla.",
    en: "If an account exists with this email, we've sent a password reset link. Check your inbox (and spam folder).",
    ru: "Если аккаунт с этой почтой существует, мы отправили ссылку для сброса пароля. Проверьте входящие (и спам).",
  },
  "auth.forgot.backToLogin": { az: "← Girişə qayıt", en: "← Back to sign in", ru: "← Назад ко входу" },
  "auth.reset.title": { az: "Yeni parol təyin et", en: "Set a new password", ru: "Установите новый пароль" },
  "auth.reset.subtitle": {
    az: "Hesabın üçün yeni parol seç.",
    en: "Choose a new password for your account.",
    ru: "Выберите новый пароль для аккаунта.",
  },
  "auth.reset.newPassword": { az: "Yeni parol", en: "New password", ru: "Новый пароль" },
  "auth.reset.confirm": { az: "Parolu təsdiqlə", en: "Confirm password", ru: "Подтвердите пароль" },
  "auth.reset.submit": { az: "Parolu yenilə", en: "Update password", ru: "Обновить пароль" },
  "auth.reset.saving": { az: "Yenilənir...", en: "Updating...", ru: "Обновление..." },
  "auth.reset.success": {
    az: "Parol yeniləndi! İndi girişə yönləndirilirsən...",
    en: "Password updated! Redirecting to sign in...",
    ru: "Пароль обновлён! Перенаправляем ко входу...",
  },
  "auth.reset.invalidLink": {
    az: "Bərpa linki etibarsız və ya vaxtı keçib. Yenidən cəhd et.",
    en: "The reset link is invalid or expired. Please try again.",
    ru: "Ссылка недействительна или истекла. Попробуйте снова.",
  },
  "auth.reset.waiting": { az: "Link yoxlanılır...", en: "Verifying link...", ru: "Проверка ссылки..." },

  // ── Haqqımızda səhifəsi ──
  "about.login": { az: "Daxil ol", en: "Log in", ru: "Войти" },
  "about.mission.badge": { az: "Missiyamız", en: "Our mission", ru: "Наша миссия" },
  "about.mission.title1": { az: "Azərbaycan üçün ən yaxşı təhsili qur və ", en: "Build the best education for Azerbaijan and ", ru: "Создай лучшее образование для Азербайджана и " },
  "about.mission.titleHi": { az: "hamıya çatdır", en: "make it available to all", ru: "сделай его доступным для всех" },
  "about.mission.body": {
    az: "Imparo — məktəblilərin öyrənməyi sevməsi üçün qurulmuş oyunlaşdırılmış təhsil platformasıdır. İnanırıq ki, keyfiyyətli təhsil imtiyaz yox, hüquqdur.",
    en: "Imparo is a gamified learning platform built to help students fall in love with learning. We believe quality education is a right, not a privilege.",
    ru: "Imparo — это геймифицированная образовательная платформа, созданная, чтобы школьники полюбили учёбу. Мы верим, что качественное образование — это право, а не привилегия.",
  },
  "about.products.heading": { az: "Nə təklif edirik", en: "What we offer", ru: "Что мы предлагаем" },
  "about.prod.imparo.title": { az: "Imparo", en: "Imparo", ru: "Imparo" },
  "about.prod.imparo.desc": {
    az: "1–8-ci siniflər üçün interaktiv öyrənmə platforması — Riyaziyyat, Azərbaycan dili, İngilis dili, həmçinin Rəqəmsal Təhlükəsizlik və Maliyyə Savadlılığı, oyun kimi.",
    en: "An interactive learning platform for grades 1–8 — Math, Azerbaijani, English, plus Digital Safety and Financial Literacy, like a game.",
    ru: "Интерактивная платформа для 1–8 классов — математика, азербайджанский, английский, а также цифровая безопасность и финансовая грамотность, как игра.",
  },
  "about.prod.plus.title": { az: "Imparo Plus", en: "Imparo Plus", ru: "Imparo Plus" },
  "about.prod.plus.desc": {
    az: "Limitsiz can və 2× zümrüd ilə öyrənməni daha rahat və sürətli et.",
    en: "Make learning smoother and faster with unlimited hearts and 2× gems.",
    ru: "Сделай учёбу удобнее и быстрее с безлимитными жизнями и 2× кристаллами.",
  },
  "about.prod.school.title": { az: "Imparo Məktəb", en: "Imparo for Schools", ru: "Imparo для школ" },
  "about.prod.school.desc": {
    az: "Müəllimlər üçün: sinif yarat, tapşırıq ver, şagirdlərin irəliləyişini izlə — hamısı bir yerdə.",
    en: "For teachers: create classes, assign tasks and track student progress — all in one place.",
    ru: "Для учителей: создавай классы, давай задания и отслеживай прогресс учеников — всё в одном месте.",
  },
  "about.more": { az: "Ətraflı", en: "Learn more", ru: "Подробнее" },
  "about.values.heading": { az: "Yanaşmamız", en: "Our approach", ru: "Наш подход" },
  "about.val.game.title": { az: "Oyun kimi öyrənmə", en: "Learning like a game", ru: "Учёба как игра" },
  "about.val.game.desc": {
    az: "XP, seriya, liqa və mükafatlar — motivasiyanı yüksək saxlayan təcrübə.",
    en: "XP, streaks, leagues and rewards — an experience that keeps motivation high.",
    ru: "XP, серии, лиги и награды — опыт, который держит мотивацию на высоте.",
  },
  "about.val.curriculum.title": { az: "Kurikuluma uyğun", en: "Curriculum-aligned", ru: "По учебной программе" },
  "about.val.curriculum.desc": {
    az: "Bütün məzmun Azərbaycan təhsil proqramına (1–8 sinif) uyğun hazırlanır — məktəblə sinxron.",
    en: "All content follows the Azerbaijani curriculum (grades 1–8) — in sync with school.",
    ru: "Весь контент соответствует азербайджанской программе (1–8 классы) — синхронно со школой.",
  },
  "about.val.access.title": { az: "Hamı üçün əlçatan", en: "Accessible to everyone", ru: "Доступно каждому" },
  "about.val.access.desc": {
    az: "Əsas öyrənmə pulsuzdur. Hədəfimiz keyfiyyətli təhsili hər şagirdə çatdırmaqdır.",
    en: "Core learning is free. Our goal is to bring quality education to every student.",
    ru: "Основное обучение бесплатно. Наша цель — дать качественное образование каждому ученику.",
  },
  "about.stats.subjects": { az: "Fənn", en: "Subjects", ru: "Предметы" },
  "about.stats.lessons": { az: "İnteraktiv dərs", en: "Interactive lessons", ru: "Интерактивных уроков" },
  "about.stats.grades": { az: "Sinif", en: "Grades", ru: "Классы" },
  "about.contact.heading": { az: "Bizimlə əlaqə", en: "Contact us", ru: "Свяжитесь с нами" },
  "about.contact.body": { az: "Sual, əməkdaşlıq və ya təklif üçün yaz:", en: "For questions, partnerships or feedback, write to us:", ru: "По вопросам, сотрудничеству или предложениям пишите нам:" },
  "about.cta.title": { az: "Öyrənməyə bu gün başla", en: "Start learning today", ru: "Начни учиться сегодня" },
  "about.cta.body": { az: "Pulsuz, sadə və əyləncəli. Zefi səni gözləyir!", en: "Free, simple and fun. Zefi is waiting for you!", ru: "Бесплатно, просто и весело. Zefi ждёт тебя!" },
  "about.cta.btn": { az: "Pulsuz başla", en: "Start free", ru: "Начать бесплатно" },

  // ── Footer (Haqqımızda + hüquqi səhifələr) ──
  "ft.col.products": { az: "Məhsullar", en: "Products", ru: "Продукты" },
  "ft.col.support": { az: "Dəstək", en: "Support", ru: "Поддержка" },
  "ft.col.legal": { az: "Hüquqi", en: "Legal", ru: "Правовое" },
  "ft.about": { az: "Haqqımızda", en: "About us", ru: "О нас" },
  "ft.mission": { az: "Missiya", en: "Mission", ru: "Миссия" },
  "ft.blog": { az: "Bloq", en: "Blog", ru: "Блог" },
  "ft.careers": { az: "Karyera", en: "Careers", ru: "Карьера" },
  "ft.efficacy": { az: "Səmərəlilik", en: "Efficacy", ru: "Эффективность" },
  "ft.school": { az: "Imparo Məktəb", en: "Imparo for Schools", ru: "Imparo для школ" },
  "ft.shop": { az: "Mağaza", en: "Store", ru: "Магазин" },
  "ft.help": { az: "Yardım mərkəzi", en: "Help center", ru: "Центр помощи" },
  "ft.contact": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "ft.partners": { az: "Partnyorluq", en: "Partnerships", ru: "Партнёрство" },
  "ft.investors": { az: "İnvestorlar", en: "Investors", ru: "Инвесторы" },
  "ft.terms": { az: "Şərtlər", en: "Terms", ru: "Условия" },
  "ft.privacy": { az: "Məxfilik", en: "Privacy", ru: "Конфиденциальность" },
  "scene.alt": { az: "Təpələr və ağaclar arasında Zefi", en: "Zefi among hills and trees", ru: "Зефи среди холмов и деревьев" },
  "scene.zefi": { az: "Zefi əl yelləyir", en: "Zefi waving", ru: "Зефи машет рукой" },
  "ft.rights": { az: "Bütün hüquqlar qorunur.", en: "All rights reserved.", ru: "Все права защищены." },

  // ── Hüquqi (ümumi) ──
  // DİQQƏT: tarix burada YAZILMIR — lib/legal.ts-dəki LEGAL_UPDATED-dən gəlir.
  // Əvvəl üç dildə əl ilə yazılırdı və sənəd dəyişəndə köhnəlirdi.
  "legal.updated": { az: "Son yenilənmə: {d}", en: "Last updated: {d}", ru: "Обновлено: {d}" },
  "legal.notice.body": {
    az: "İstifadə şərtlərini və Məxfilik siyasətini yenilədik.",
    en: "We have updated our Terms of Use and Privacy Policy.",
    ru: "Мы обновили Условия использования и Политику конфиденциальности.",
  },
  "legal.notice.terms": { az: "Şərtlərə bax", en: "Read the Terms", ru: "Открыть условия" },
  "legal.notice.privacy": { az: "Məxfiliyə bax", en: "Read the Privacy Policy", ru: "Открыть политику" },
  "legal.notice.close": { az: "Bildirişi bağla", en: "Dismiss notice", ru: "Закрыть уведомление" },
  "legal.changed": { az: "Bu dəfə nə dəyişdi", en: "What changed this time", ru: "Что изменилось" },
  "legal.changedBody": {
    az: "Fənn siyahısı düzəldildi (5 fənn), reklamla bağlı ziddiyyət aradan qaldırıldı (Imparo reklam göstərmir), alt-emalçılara Cloudflare və Resend əlavə olundu, könüllü valideyn hesabatı ayrıca izah edildi və mövcud olmayan App Store/Google Play alışı barədə bənd silindi.",
    en: "Corrected the subject list (5 subjects), removed a contradiction about ads (Imparo shows no ads), added Cloudflare and Resend to sub-processors, documented the optional parent report, and removed a clause about App Store/Google Play purchases that do not exist.",
    ru: "Исправлен список предметов (5), устранено противоречие про рекламу (Imparo не показывает рекламу), в список субобработчиков добавлены Cloudflare и Resend, описан необязательный родительский отчёт, удалён пункт о покупках через App Store/Google Play, которых нет.",
  },
  "legal.contactLine": { az: "Sualın var? Bizə yaz:", en: "Have a question? Write to us:", ru: "Есть вопрос? Напишите нам:" },

  // ── Info səhifələri (Bloq, Karyera, İnvestorlar, Səmərəlilik) ──
  "info.home": { az: "Ana səhifə", en: "Home", ru: "Главная" },
  "info.contactBtn": { az: "Bizə yaz", en: "Write to us", ru: "Написать нам" },

  "blog.title": { az: "Bloq", en: "Blog", ru: "Блог" },
  "blog.body": {
    az: "Tezliklə burada təhsil, öyrənmə üsulları və Imparo yenilikləri haqqında məqalələr paylaşacağıq. İzləməkdə qal!",
    en: "Soon we’ll share articles here about education, learning methods and Imparo updates. Stay tuned!",
    ru: "Скоро мы будем публиковать здесь статьи об образовании, методах обучения и новостях Imparo. Следите за обновлениями!",
  },

  "careers.title": { az: "Karyera", en: "Careers", ru: "Карьера" },
  "careers.body": {
    az: "Imparo Azərbaycan təhsilini dəyişmək istəyən kiçik, həvəsli komandadır. Hazırda rəsmi açıq vakansiyamız olmasa da, missiyamıza inanırsansa və töhfə vermək istəyirsənsə — bizə yaz. Müəllim, dizayner, developer və məzmun yaradıcılarını həmişə eşitməyə açıqıq.",
    en: "Imparo is a small, passionate team on a mission to transform education in Azerbaijan. We may not have formal openings right now, but if you believe in our mission and want to contribute — write to us. We’re always open to teachers, designers, developers and content creators.",
    ru: "Imparo — небольшая увлечённая команда, меняющая образование в Азербайджане. Сейчас у нас нет формальных вакансий, но если вы разделяете нашу миссию и хотите внести вклад — напишите нам. Мы всегда рады учителям, дизайнерам, разработчикам и авторам контента.",
  },

  "investors.title": { az: "İnvestorlar", en: "Investors", ru: "Инвесторы" },
  "investors.body": {
    az: "Imparo Azərbaycan bazarında böyüyən oyunlaşdırılmış təhsil platformasıdır — həm B2C (şagird/valideyn), həm B2B (məktəb/müəllim) istiqamətləri ilə. Əməkdaşlıq, sərmayə və ya strateji tərəfdaşlıq marağınız varsa, bizimlə əlaqə saxlayın.",
    en: "Imparo is a growing gamified education platform in the Azerbaijani market — with both B2C (students/parents) and B2B (schools/teachers) directions. If you’re interested in collaboration, investment or strategic partnership, get in touch.",
    ru: "Imparo — растущая геймифицированная образовательная платформа на азербайджанском рынке — с направлениями B2C (ученики/родители) и B2B (школы/учителя). Если вам интересно сотрудничество, инвестиции или стратегическое партнёрство — свяжитесь с нами.",
  },

  // ── Valideyn hesabatı (Ayarlar) ──
  // ── Dərsdən çıxış təsdiqi ──
  "run.quitTitle": { az: "Dayan, getmə!", en: "Wait, don’t go!", ru: "Постой, не уходи!" },
  "run.quitBody": {
    az: "İndi çıxsan bu dərsdəki irəliləyişin itəcək.",
    en: "If you quit now, your progress in this lesson is lost.",
    ru: "Если выйдешь сейчас, прогресс в этом уроке пропадёт.",
  },
  // Say cümlənin İÇİNDƏ deyil, ayrıca göstərilir. Səbəb: "1 tasks" qrammatik
  // səhvdir, rus dilində isə üç fərqli forma var (1 задание / 2 задания /
  // 5 заданий). Rəqəmi cümlədən çıxarmaq üç dildə də düzgün nəticə verir.
  "run.quitBodyStart": {
    az: "İndi çıxsan bu dərsə yenidən başlamalı olacaqsan.",
    en: "If you quit now, you’ll have to start this lesson over.",
    ru: "Если выйдешь сейчас, урок придётся начать заново.",
  },
  "run.quitProgress": { az: "Həll edilib", en: "Answered", ru: "Отвечено" },
  "run.quitStay": { az: "Dərsə davam et", en: "Keep learning", ru: "Продолжить урок" },
  "run.quitLeave": { az: "Dərsi bitir", en: "End session", ru: "Завершить урок" },

  "parent.title": { az: "Valideyn hesabatı", en: "Parent report", ru: "Отчёт для родителя" },
  "parent.heading": { az: "Həftəlik hesabatı valideynə göndər", en: "Send a weekly report to a parent", ru: "Отправлять родителю еженедельный отчёт" },
  "parent.hint": {
    az: "Hər bazar günü valideynin e-poçtuna qısa hesabat gedir: nə qədər məşq etdin, hansı fənlərdə irəlilədin, harada çətinlik çəkdin. Ünvan təsdiqlənməyənə qədər heç nə göndərilmir.",
    en: "Every Sunday a short report goes to your parent’s email: how much you practised, where you improved and where you struggled. Nothing is sent until the address is confirmed.",
    ru: "Каждое воскресенье на почту родителя приходит короткий отчёт: сколько занимался, где прогресс, где трудности. До подтверждения адреса ничего не отправляется.",
  },
  "parent.placeholder": { az: "valideyn@nümunə.com", en: "parent@example.com", ru: "parent@example.com" },
  "parent.add": { az: "Əlavə et", en: "Add", ru: "Добавить" },
  "parent.change": { az: "Dəyiş", en: "Change", ru: "Изменить" },
  "parent.remove": { az: "Sil", en: "Remove", ru: "Удалить" },
  "parent.removed": { az: "Ünvan silindi — hesabat göndərilməyəcək.", en: "Address removed — no reports will be sent.", ru: "Адрес удалён — отчёты отправляться не будут." },
  "parent.pending": { az: "təsdiq gözlənilir", en: "awaiting confirmation", ru: "ожидает подтверждения" },
  "parent.verified": { az: "təsdiqlənib", en: "confirmed", ru: "подтверждён" },
  "parent.sentTo": {
    az: "Təsdiq məktubu {email} ünvanına göndərildi. Valideyn linkə klikləyəndə hesabatlar başlayacaq.",
    en: "A confirmation email was sent to {email}. Reports start once your parent clicks the link.",
    ru: "Письмо для подтверждения отправлено на {email}. Отчёты начнутся после перехода по ссылке.",
  },
  "parent.mailFail": {
    az: "Ünvan yadda saxlanıldı, amma təsdiq məktubu göndərilə bilmədi. Bir azdan yenidən yoxla.",
    en: "The address was saved, but the confirmation email could not be sent. Please try again shortly.",
    ru: "Адрес сохранён, но письмо для подтверждения отправить не удалось. Попробуйте позже.",
  },
  "parent.err": { az: "Alınmadı, yenidən yoxla.", en: "Something went wrong, please try again.", ru: "Не получилось, попробуйте снова." },

  "partners.title": { az: "Partnyorluq", en: "Partnerships", ru: "Партнёрство" },
  "partners.intro": {
    az: "Imparo-nu tək qurmuruq. Məktəblər, təhsil mərkəzləri, fondlar və şirkətlərlə birlikdə daha çox şagirdə çatırıq. Aşağıda hazırda açıq olan əməkdaşlıq istiqamətləri var.",
    en: "We aren’t building Imparo alone. Together with schools, learning centres, foundations and companies we reach more students. Below are the partnership tracks currently open.",
    ru: "Мы строим Imparo не в одиночку. Вместе со школами, учебными центрами, фондами и компаниями мы доходим до большего числа учеников. Ниже — открытые сейчас направления партнёрства.",
  },
  "partners.whoTitle": { az: "Kimlərlə işləyirik", en: "Who we work with", ru: "С кем мы работаем" },

  "partners.schools.t": { az: "Məktəblər", en: "Schools", ru: "Школы" },
  "partners.schools.b": {
    az: "Müəllim sinif yaradır, tapşırıq təyin edir və hər şagirdin tərəqqisini bir ekrandan izləyir. Quraşdırma tələb olunmur — şagirdlər brauzerdən girir. Pilot sinifləri üçün tam pulsuzdur.",
    en: "A teacher creates a class, assigns tasks and follows every student’s progress on one screen. Nothing to install — students sign in from the browser. Free for pilot classes.",
    ru: "Учитель создаёт класс, назначает задания и видит прогресс каждого ученика на одном экране. Ничего устанавливать не нужно — ученики заходят из браузера. Для пилотных классов бесплатно.",
  },
  "partners.tutors.t": { az: "Repetitor və hazırlıq mərkəzləri", en: "Tutors and prep centres", ru: "Репетиторы и учебные центры" },
  "partners.tutors.b": {
    az: "Dərs aralarında şagirdin nə qədər məşq etdiyini görmək çətindir. Imparo ev tapşırığını avtomatlaşdırır və hansı mövzunun oturmadığını rəqəmlə göstərir.",
    en: "It’s hard to see how much a student practises between lessons. Imparo automates homework and shows, in numbers, which topic hasn’t landed yet.",
    ru: "Трудно понять, сколько ученик занимается между уроками. Imparo автоматизирует домашнюю работу и показывает в цифрах, какая тема не усвоена.",
  },
  "partners.ngo.t": { az: "Fondlar və qeyri-hökumət təşkilatları", en: "Foundations and NGOs", ru: "Фонды и НПО" },
  "partners.ngo.b": {
    az: "Regionlarda internetə çıxışı olan hər şagird üçün platforma pulsuzdur. Qrant və sosial təsir layihələrində məzmun, hesabat və ölçmə tərəfini biz götürürük.",
    en: "The platform is free for every student in the regions with internet access. In grant and social-impact projects we take on the content, reporting and measurement side.",
    ru: "Платформа бесплатна для каждого ученика в регионах, у кого есть интернет. В грантовых и социальных проектах мы берём на себя контент, отчётность и измерение результата.",
  },
  "partners.csr.t": { az: "Şirkətlər (sosial məsuliyyət)", en: "Companies (CSR)", ru: "Компании (КСО)" },
  "partners.csr.b": {
    az: "Sosial məsuliyyət büdcəsini konkret nəticəyə çevir: seçdiyin məktəb və ya rayon üçün Imparo Plus abunəliyini sponsorlaşdır, təsirin rüblük hesabatını al.",
    en: "Turn a CSR budget into a concrete outcome: sponsor Imparo Plus for a school or district of your choice and receive a quarterly impact report.",
    ru: "Превратите бюджет КСО в конкретный результат: спонсируйте Imparo Plus для выбранной школы или района и получайте ежеквартальный отчёт о влиянии.",
  },
  "partners.content.t": { az: "Məzmun və texnologiya partnyorları", en: "Content and technology partners", ru: "Контентные и технологические партнёры" },
  "partners.content.b": {
    az: "Müəllif, nəşriyyat və ya təhsil məhsulu qurursansa — məzmun mübadiləsi və inteqrasiya danışa bilərik.",
    en: "If you’re an author, a publisher or building an education product — we can talk about content exchange and integration.",
    ru: "Если вы автор, издательство или создаёте образовательный продукт — можем обсудить обмен контентом и интеграцию.",
  },

  "partners.getTitle": { az: "Partnyor nə alır", en: "What a partner gets", ru: "Что получает партнёр" },
  "partners.get1": {
    az: "Pilot müddətində platformaya tam pulsuz giriş — şagird sayına limit qoymuruq.",
    en: "Full free access to the platform during the pilot — we set no cap on the number of students.",
    ru: "Полный бесплатный доступ к платформе на время пилота — без ограничения по числу учеников.",
  },
  "partners.get2": {
    az: "Sinif və ya qrup üzrə tərəqqi hesabatı: kim nə qədər məşq edib, hansı mövzu çətin gəlib.",
    en: "Progress reporting by class or group: who practised how much, and which topic proved hard.",
    ru: "Отчёт о прогрессе по классу или группе: кто сколько занимался и какая тема оказалась трудной.",
  },
  "partners.get3": {
    az: "1–8-ci siniflər üçün kurikuluma uyğun hazır məzmun — sıfırdan material hazırlamağa ehtiyac yoxdur.",
    en: "Ready curriculum-aligned content for grades 1–8 — no need to build material from scratch.",
    ru: "Готовый контент по программе 1–8 классов — не нужно создавать материалы с нуля.",
  },
  "partners.get4": {
    az: "Şagird məlumatlarının qorunması: məlumatlar satılmır, reklam üçün istifadə olunmur.",
    en: "Student data protection: data is never sold and never used for advertising.",
    ru: "Защита данных учеников: данные не продаются и не используются для рекламы.",
  },

  "partners.howTitle": { az: "Necə başlayır", en: "How it starts", ru: "С чего начинается" },
  "partners.how1.t": { az: "Yaz", en: "Write to us", ru: "Напишите" },
  "partners.how1.b": {
    az: "Kim olduğunu və təxminən neçə şagirdə çatmaq istədiyini bir abzasda yaz. Uzun təqdimat lazım deyil.",
    en: "Tell us in one paragraph who you are and roughly how many students you want to reach. No long deck needed.",
    ru: "В одном абзаце расскажите, кто вы и до скольких учеников хотите дойти. Длинная презентация не нужна.",
  },
  "partners.how2.t": { az: "Qısa görüş", en: "A short call", ru: "Короткий созвон" },
  "partners.how2.b": {
    az: "20 dəqiqəlik onlayn söhbətdə ehtiyacına baxırıq və Imparo-nun ona uyğun olub-olmadığını açıq deyirik.",
    en: "In a 20-minute call we look at your need and say plainly whether Imparo fits it.",
    ru: "За 20 минут разбираем вашу задачу и честно говорим, подходит ли Imparo.",
  },
  "partners.how3.t": { az: "Pilot", en: "Pilot", ru: "Пилот" },
  "partners.how3.b": {
    az: "Bir sinif və ya qrupla başlayırıq. Dörd həftədən sonra nəticəyə birlikdə baxırıq — işləməsə, genişləndirmirik.",
    en: "We start with one class or group. After four weeks we look at the results together — if it doesn’t work, we don’t scale it.",
    ru: "Начинаем с одного класса или группы. Через четыре недели вместе смотрим на результат — если не работает, не масштабируем.",
  },

  "partners.honest": {
    az: "Açıq deyək: Imparo erkən mərhələdədir. Böyük vədlər vermirik — kiçik pilotla başlayır, nəticə görünəndə genişləndiririk.",
    en: "To be straight with you: Imparo is at an early stage. We don’t make big promises — we start with a small pilot and scale once results show.",
    ru: "Скажем прямо: Imparo на раннем этапе. Мы не даём громких обещаний — начинаем с небольшого пилота и расширяем, когда виден результат.",
  },
  "partners.statSubjects": { az: "fənn", en: "subjects", ru: "предметов" },
  "partners.statGrades": { az: "sinif əhatəsi", en: "grades covered", ru: "классов охвачено" },
  "partners.statLessons": { az: "hazır dərs", en: "ready lessons", ru: "готовых уроков" },
  "partners.cta": { az: "Partnyorluq üçün yaz", en: "Write about a partnership", ru: "Написать о партнёрстве" },

  "efficacy.title": { az: "Səmərəlilik", en: "Efficacy", ru: "Эффективность" },
  "efficacy.intro": {
    az: "Imparo təsadüfi qurulmayıb — hər elementi öyrənmənin işləməsi üçün düşünülüb. Yanaşmamızın əsasında dayanan üç prinsip:",
    en: "Imparo isn’t built at random — every element is designed to make learning work. Three principles behind our approach:",
    ru: "Imparo построен не случайно — каждый элемент создан, чтобы обучение работало. Три принципа нашего подхода:",
  },
  "efficacy.p1t": { az: "Aralıqlı təkrar (SRS)", en: "Spaced repetition (SRS)", ru: "Интервальное повторение (SRS)" },
  "efficacy.p1b": {
    az: "Səhv etdiyin suallar düzgün cavablanana qədər təkrarlanır və vaxt keçdikcə yenidən qarşına çıxır — beləcə bilik uzunmüddətli yaddaşa köçür.",
    en: "Questions you get wrong repeat until answered correctly and resurface over time — so knowledge moves into long-term memory.",
    ru: "Вопросы, в которых вы ошиблись, повторяются до верного ответа и возвращаются со временем — так знания переходят в долговременную память.",
  },
  "efficacy.p2t": { az: "Oyunlaşdırma", en: "Gamification", ru: "Геймификация" },
  "efficacy.p2b": {
    az: "XP, seriya, liqa və mükafatlar motivasiyanı yüksək saxlayır və gündəlik öyrənmə vərdişi formalaşdırır.",
    en: "XP, streaks, leagues and rewards keep motivation high and build a daily learning habit.",
    ru: "XP, серии, лиги и награды поддерживают мотивацию и формируют ежедневную привычку к учёбе.",
  },
  "efficacy.p3t": { az: "Kurikuluma uyğunluq", en: "Curriculum alignment", ru: "Соответствие программе" },
  "efficacy.p3b": {
    az: "Bütün məzmun Azərbaycan təhsil proqramına (1–8 sinif) uyğundur — məktəbdə öyrənilənlə birbaşa üst-üstə düşür.",
    en: "All content aligns with the Azerbaijani curriculum (grades 1–8) — directly matching what’s learned at school.",
    ru: "Весь контент соответствует азербайджанской программе (1–8 классы) — напрямую совпадает с тем, что учат в школе.",
  },

  // ── Şərtlər ──
  "terms.title": { az: "İstifadə şərtləri", en: "Terms of Service", ru: "Условия использования" },
  "terms.intro": {
    az: "Imparo veb-saytı və tətbiqi (birlikdə “Xidmət”) Imparo tərəfindən idarə olunur. Xidmətə daxil olmaqla və ya ondan istifadə etməklə bu Şərtləri oxuduğunu, başa düşdüyünü və onlara (gələcək dəyişikliklər daxil) əməl etməyə razı olduğunu təsdiq edirsən. Razı deyilsənsə, Xidmətdən istifadə etməyə icazən yoxdur.",
    en: "The Imparo website and app (together, the “Service”) are operated by Imparo. By accessing or using the Service, you confirm that you have read, understood and agree to these Terms (including future changes). If you do not agree, you are not authorized to use the Service.",
    ru: "Веб-сайт и приложение Imparo (вместе — «Сервис») управляются Imparo. Получая доступ к Сервису или используя его, вы подтверждаете, что прочитали, поняли и согласны с настоящими Условиями (включая будущие изменения). Если вы не согласны, вы не вправе пользоваться Сервисом.",
  },
  "terms.s1.t": { az: "1. Şərtlərin qəbulu və dəyişikliklər", en: "1. Acceptance and changes", ru: "1. Принятие и изменения" },
  "terms.s1.b": {
    az: "Bu Şərtləri yeniləyə bilərik. Dəyişiklik olduqda saytda ən azı 7 gün bildiriş yerləşdirir və aşağıda sonuncu yeniləmə tarixini göstəririk. Dəyişikliklər 7 günlük müddətin sonunda və ya dəyişiklikdən sonra Xidmətə ilk dəfə daxil olduğun andan (hansı əvvəldirsə) qüvvəyə minir.",
    en: "We may update these Terms. When we do, we post a notice on the site for at least 7 days and indicate the last revised date below. Changes take effect at the end of the 7-day period or the first time you use the Service after the change, whichever is earlier.",
    ru: "Мы можем обновлять эти Условия. При изменении мы размещаем уведомление на сайте не менее 7 дней и указываем дату последней редакции ниже. Изменения вступают в силу по окончании 7-дневного срока или при первом использовании Сервиса после изменения — в зависимости от того, что наступит раньше.",
  },
  "terms.s2.t": { az: "2. Xidmətin təsviri", en: "2. Description of the Service", ru: "2. Описание Сервиса" },
  "terms.s2.b": {
    az: "Imparo — 1–8-ci siniflər üçün oyunlaşdırılmış onlayn öyrənmə platformasıdır (Riyaziyyat, Azərbaycan dili, İngilis dili, Rəqəmsal Təhlükəsizlik və Maliyyə Savadlılığı; fənn siyahısı vaxtaşırı genişlənir). Xidmətin istənilən hissəsini istənilən vaxt öz mülahizəmizlə yeniləyə, dəyişə, dayandıra və ya ləğv edə bilərik.",
    en: "Imparo is a gamified online learning platform for grades 1–8 (Math, Azerbaijani, English, Digital Safety and Financial Literacy; the subject list expands over time). We may update, change, suspend or discontinue any part of the Service at any time at our discretion.",
    ru: "Imparo — геймифицированная онлайн-платформа для 1–8 классов (математика, азербайджанский, английский, цифровая безопасность и финансовая грамотность; список предметов со временем расширяется). Мы можем обновлять, изменять, приостанавливать или прекращать любую часть Сервиса в любое время по своему усмотрению.",
  },
  "terms.s3.t": { az: "3. Qeydiyyat və hesab", en: "3. Registration and account", ru: "3. Регистрация и аккаунт" },
  "terms.s3.b": {
    az: "Qeydiyyat zamanı doğru, güncəl və tam məlumat verməlisən; parolunun və hesabının təhlükəsizliyini qorumalısan; hesabın altında baş verən bütün fəaliyyətlərə görə tam cavabdehsən.",
    en: "When registering you must provide accurate, current and complete information; keep your password and account secure; and you are fully responsible for all activity under your account.",
    ru: "При регистрации вы должны предоставить точные, актуальные и полные данные; обеспечивать безопасность пароля и аккаунта; и полностью отвечаете за все действия под вашим аккаунтом.",
  },
  "terms.s4.t": { az: "4. Yaş və valideyn razılığı", en: "4. Age and parental consent", ru: "4. Возраст и согласие родителей" },
  "terms.s4.b": {
    az: "Xidmət məktəblilərə yönəlib. 13 yaşdan kiçik uşaqların hesabları valideyn/qəyyum razılığı və nəzarəti ilə yaradılmalı və istifadə olunmalıdır. Valideyn kimi uşağının hesabına və istifadəsinə görə məsuliyyəti öz üzərinə götürürsən.",
    en: "The Service is aimed at students. Accounts of children under 13 must be created and used with parental/guardian consent and supervision. As a parent, you accept responsibility for your child’s account and use.",
    ru: "Сервис предназначен для школьников. Аккаунты детей младше 13 лет должны создаваться и использоваться с согласия и под контролем родителей/опекунов. Как родитель, вы принимаете ответственность за аккаунт и использование ребёнком.",
  },
  "terms.s5.t": { az: "5. Qəbuledilən istifadə", en: "5. Acceptable use", ru: "5. Допустимое использование" },
  "terms.s5.b": {
    az: "Xidmətdən istifadəyə görə özün cavabdehsən. Qadağandır:\n• Xidməti qanunsuz məqsədlə və ya başqalarına zərər üçün istifadə etmək;\n• Sistemə icazəsiz daxil olmaq, onu pozmaq və ya avtomatik toplama (bot/scraping) tətbiq etmək;\n• Məzmunu icazəsiz kopyalamaq, satmaq və ya yenidən yaymaq;\n• Təhqiredici, təhdidedici, nifrət yönümlü və ya qanunu pozan məzmun yerləşdirmək.",
    en: "You are responsible for your use of the Service. The following are prohibited:\n• Using the Service unlawfully or to harm others;\n• Unauthorized access, disruption, or automated collection (bots/scraping);\n• Copying, selling or redistributing content without permission;\n• Posting abusive, threatening, hateful or unlawful content.",
    ru: "Вы отвечаете за своё использование Сервиса. Запрещается:\n• Использовать Сервис незаконно или во вред другим;\n• Несанкционированный доступ, нарушение работы или автоматический сбор (боты/скрейпинг);\n• Копировать, продавать или распространять контент без разрешения;\n• Размещать оскорбительный, угрожающий, ненавистнический или незаконный контент.",
  },
  "terms.s6.t": { az: "6. İstifadəçi məzmunu və lisenziya", en: "6. User content and license", ru: "6. Пользовательский контент и лицензия" },
  "terms.s6.b": {
    az: "Xidmətə məzmun (rəy, mətn, şəkil və s.) göndərdikdə, Imparo-ya həmin məzmunu Xidmətlə əlaqədar istifadə etmək, çoxaltmaq, uyğunlaşdırmaq və yaymaq üçün pulsuz, qeyri-eksklüziv, dünya miqyaslı lisenziya verirsən. Göndərdiyin məzmuna sahib olduğunu və ya lazımi hüquqlara malik olduğunu təsdiq edirsən.",
    en: "When you submit content (reviews, text, images, etc.) to the Service, you grant Imparo a free, non-exclusive, worldwide license to use, reproduce, adapt and distribute that content in connection with the Service. You confirm you own or have the necessary rights to the content you submit.",
    ru: "Отправляя контент (отзывы, текст, изображения и т. п.) в Сервис, вы предоставляете Imparo бесплатную, неисключительную, всемирную лицензию на использование, воспроизведение, адаптацию и распространение этого контента в связи с Сервисом. Вы подтверждаете, что владеете контентом или имеете необходимые права.",
  },
  "terms.s7.t": { az: "7. Əqli mülkiyyət və ticarət nişanları", en: "7. Intellectual property and trademarks", ru: "7. Интеллектуальная собственность и товарные знаки" },
  "terms.s7.b": {
    az: "Platformadakı bütün məzmun, dizayn, proqram, loqo, “Imparo” adı və Zefi personajı Imparo-ya və ya lisenziarlarına məxsusdur və müəllif hüququ ilə qorunur. Şəxsi, qeyri-kommersiya öyrənmə məqsədi xaricində icazəsiz istifadə, çoxaltma və ya yayım qadağandır.",
    en: "All content, design, software, logo, the “Imparo” name and the Zefi character belong to Imparo or its licensors and are protected by copyright. Unauthorized use, reproduction or distribution outside personal, non-commercial learning is prohibited.",
    ru: "Весь контент, дизайн, программное обеспечение, логотип, название «Imparo» и персонаж Zefi принадлежат Imparo или её лицензиарам и защищены авторским правом. Несанкционированное использование, воспроизведение или распространение вне личного некоммерческого обучения запрещено.",
  },
  "terms.s8.t": { az: "8. Imparo Plus və avtomatik yenilənmə", en: "8. Imparo Plus and auto-renewal", ru: "8. Imparo Plus и автопродление" },
  "terms.s8.b": {
    az: "Əsas öyrənmə pulsuzdur. Imparo Plus ödənişli abunəlikdir. Avtomatik yenilənən abunəlik ləğv edilməyənə qədər hər dövr üçün avtomatik olaraq yenilənir və hesabına yazılır. Ləğv etmək və ya dəyişmək üçün hesabına daxil olub abunəliyi idarə et.",
    en: "Core learning is free. Imparo Plus is a paid subscription. An auto-renewing subscription automatically renews and is billed each period until you cancel. To cancel or change it, log in to your account and manage the subscription.",
    ru: "Основное обучение бесплатно. Imparo Plus — платная подписка. Автопродлеваемая подписка автоматически продлевается и списывается каждый период до отмены. Чтобы отменить или изменить, войдите в аккаунт и управляйте подпиской.",
  },
  "terms.s9.t": { az: "9. Virtual əşyalar (zümrüd, can)", en: "9. Virtual items (gems, hearts)", ru: "9. Виртуальные предметы (кристаллы, жизни)" },
  "terms.s9.b": {
    az: "Xidmət daxilində virtual valyuta (zümrüd) və virtual əşyalar əldə edə bilərsən — bunlar yalnız Xidmət daxilində istifadə üçün məhdud, şəxsi, ötürülməz lisenziyadır. Imparo virtual əşyaları istənilən vaxt idarə edə, dəyişə və ya ləğv edə bilər. Onların real pul dəyəri yoxdur və başqasına ötürülə bilməz.",
    en: "Within the Service you may obtain virtual currency (gems) and virtual items — these are a limited, personal, non-transferable license for use only within the Service. Imparo may manage, modify or remove virtual items at any time. They have no real-world cash value and cannot be transferred.",
    ru: "В Сервисе вы можете получать виртуальную валюту (кристаллы) и виртуальные предметы — это ограниченная, личная, непередаваемая лицензия только для использования в Сервисе. Imparo может управлять, изменять или удалять их в любое время. Они не имеют денежной ценности и не передаются.",
  },
  "terms.s10.t": { az: "10. Ödəniş, vergilər və provayderlər", en: "10. Payment, taxes and processors", ru: "10. Оплата, налоги и провайдеры" },
  "terms.s10.b": {
    az: "Hesabınla bağlı bütün ödənişlərə və tətbiq olunan vergilərə görə cavabdehsən. Qiymətləri istənilən vaxt dəyişə bilərik. Bütün maliyyə əməliyyatları üçüncü tərəf ödəniş provayderi tərəfindən onların şərtlərinə uyğun emal olunur; provayderin fəaliyyəti/fəaliyyətsizliyinə görə (məs. sistem nasazlığı) Imparo məsuliyyət daşımır.",
    en: "You are responsible for all fees and applicable taxes on your account. We may change prices at any time. All financial transactions are processed by a third-party payment provider under their terms; Imparo is not responsible for that provider’s actions or outages.",
    ru: "Вы отвечаете за все платежи и применимые налоги по вашему аккаунту. Мы можем менять цены в любое время. Все финансовые операции обрабатываются сторонним платёжным провайдером по его условиям; Imparo не отвечает за действия или сбои этого провайдера.",
  },
  "terms.s11.t": { az: "11. Geri qaytarma siyasəti", en: "11. Refund policy", ru: "11. Политика возврата" },
  "terms.s11.b": {
    az: "Qanunla tələb olunmadıqca, ödənişlər geri qaytarılmır və virtual əşyalar üçün geri ödəmə edilmir. Abunəliyi ləğv etsən, cari ödəniş dövrünün sonuna qədər Xidmətə çıxışın qalır.",
    en: "Unless required by law, payments are non-refundable and there are no refunds for virtual items. If you cancel, you keep access until the end of the current billing period.",
    ru: "Если иное не требуется законом, платежи не возвращаются, и возврата за виртуальные предметы нет. При отмене доступ сохраняется до конца текущего периода.",
  },
  "terms.s12.t": { az: "12. Üçüncü tərəf linkləri və reklam", en: "12. Third-party links and ads", ru: "12. Ссылки третьих лиц и реклама" },
  "terms.s12.b": {
    az: "Xidmət bizə aid olmayan üçüncü tərəf saytlarına link ehtiva edə bilər. Imparo reklam göstərmir. Onların məzmununa və ya siyasətlərinə görə cavabdeh deyilik və onların istifadəsindən yaranan zərərə görə məsuliyyət daşımırıq.",
    en: "The Service may contain links to third-party sites we do not control. Imparo does not show ads. We are not responsible for their content or policies and are not liable for any harm from using them.",
    ru: "Сервис может содержать ссылки на сайты третьих лиц, которые мы не контролируем. Imparo не показывает рекламу. Мы не отвечаем за их контент или политики и не несём ответственности за вред от их использования.",
  },
  "terms.s13.t": { az: "13. Zəmanətlərin olmaması", en: "13. No warranties", ru: "13. Отсутствие гарантий" },
  "terms.s13.b": {
    az: "Xidmət “olduğu kimi” təqdim olunur. Onun fasiləsiz, qüsursuz, dəqiq və ya müəyyən nəticə verəcəyinə dair heç bir açıq və ya gizli zəmanət vermirik. Xidmət yüksək tələb, yeniləmə və ya baxım vaxtlarında əlçatmaz ola bilər.",
    en: "The Service is provided “as is”. We make no express or implied warranties that it will be uninterrupted, error-free, accurate or produce specific results. The Service may be unavailable during peak demand, upgrades or maintenance.",
    ru: "Сервис предоставляется «как есть». Мы не даём явных или подразумеваемых гарантий бесперебойной, безошибочной, точной работы или конкретных результатов. Сервис может быть недоступен при пиковой нагрузке, обновлениях или обслуживании.",
  },
  "terms.s14.t": { az: "14. Məsuliyyətin məhdudlaşdırılması", en: "14. Limitation of liability", ru: "14. Ограничение ответственности" },
  "terms.s14.b": {
    az: "Qanunun icazə verdiyi maksimum həddə, Imparo Xidmətin istifadəsindən və ya istifadə edə bilməməkdən yaranan dolayı, təsadüfi və ya nəticəvi zərərlərə görə məsuliyyət daşımır. İstənilən halda Imparo-nun ümumi məsuliyyəti son 12 ayda sənin ona ödədiyin məbləğlə (varsa) məhdudlaşır.",
    en: "To the maximum extent permitted by law, Imparo is not liable for indirect, incidental or consequential damages arising from use or inability to use the Service. In any case, Imparo’s total liability is limited to the amount you paid it (if any) in the prior 12 months.",
    ru: "В максимально допустимой законом мере Imparo не несёт ответственности за косвенный, случайный или последующий ущерб от использования или невозможности использования Сервиса. В любом случае общая ответственность Imparo ограничена суммой, уплаченной вами ей (если есть) за последние 12 месяцев.",
  },
  "terms.s15.t": { az: "15. Məsuliyyətdən azadetmə", en: "15. Indemnification", ru: "15. Возмещение ущерба" },
  "terms.s15.b": {
    az: "Xidmətə çıxışın və ya istifadən, verdiyin yanlış məlumat və ya bu Şərtləri pozman nəticəsində yaranan iddia, zərər və xərclərə (o cümlədən hüquqi xərclər) görə Imparo-nu müdafiə etməyə və zərərdən qorumağa razılıq verirsən.",
    en: "You agree to defend and hold Imparo harmless from any claims, damages and costs (including legal fees) arising from your access or use, any false information you provide, or your breach of these Terms.",
    ru: "Вы соглашаетесь защищать и ограждать Imparo от любых претензий, убытков и расходов (включая юридические), возникающих из вашего доступа или использования, предоставления ложных данных или нарушения этих Условий.",
  },
  "terms.s16.t": { az: "16. Ləğvetmə", en: "16. Termination", ru: "16. Прекращение" },
  "terms.s16.b": {
    az: "Bu Şərtləri pozan hesabları istənilən vaxt, xəbərdarlıqla və ya xəbərdarlıqsız məhdudlaşdıra/dayandıra bilərik. Sən də istənilən vaxt hesabını silə bilərsən. Mülkiyyət, məsuliyyət və qanunla bağlı bölmələr ləğvdən sonra da qüvvədə qalır.",
    en: "We may restrict or suspend accounts that violate these Terms at any time, with or without notice. You may delete your account at any time. Sections on ownership, liability and law survive termination.",
    ru: "Мы можем ограничить или приостановить нарушающие эти Условия аккаунты в любое время, с уведомлением или без. Вы можете удалить аккаунт в любое время. Разделы о собственности, ответственности и праве действуют и после прекращения.",
  },
  "terms.s17.t": { az: "17. Tətbiq olunan qanun və mübahisələr", en: "17. Governing law and disputes", ru: "17. Применимое право и споры" },
  "terms.s17.b": {
    az: "Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir. Mübahisələr əvvəlcə danışıqlar yolu ilə həll edilməyə çalışılır; həll olunmadıqda Azərbaycan Respublikasının səlahiyyətli məhkəmələrinə baxılır.",
    en: "These Terms are governed by the laws of the Republic of Azerbaijan. Disputes shall first be attempted to be resolved by negotiation; if unresolved, they shall be heard by the competent courts of the Republic of Azerbaijan.",
    ru: "Настоящие Условия регулируются законодательством Азербайджанской Республики. Споры сначала пытаются урегулировать путём переговоров; при неурегулировании они рассматриваются компетентными судами Азербайджанской Республики.",
  },
  "terms.s18.t": { az: "18. Dil, məxfilik, digər müddəalar və əlaqə", en: "18. Language, privacy, miscellaneous and contact", ru: "18. Язык, конфиденциальность, прочее и контакты" },
  "terms.s18.b": {
    az: "Bu razılaşma əslən Azərbaycan dilində yazılıb; tərcümələr arasında ziddiyyət olduqda Azərbaycan dili əsas götürülür. Xidmətdən istifadə həm də Məxfilik siyasətimizlə tənzimlənir. Hər hansı müddəa qüvvədən düşərsə, qalan müddəalar qüvvədə qalır. Suallar üçün: info@imparo.app.",
    en: "This agreement was originally written in Azerbaijani; if translations conflict, the Azerbaijani version controls. Use of the Service is also governed by our Privacy Policy. If any provision is unenforceable, the rest remain in effect. Questions: info@imparo.app.",
    ru: "Это соглашение изначально составлено на азербайджанском; при противоречии переводов преимущество имеет азербайджанская версия. Использование Сервиса также регулируется нашей Политикой конфиденциальности. Если какое-либо положение недействительно, остальные сохраняют силу. Вопросы: info@imparo.app.",
  },

  // ── Məxfilik ──
  "privacy.title": { az: "Məxfilik siyasəti", en: "Privacy Policy", ru: "Политика конфиденциальности" },
  "privacy.s0.t": { az: "Ümumi", en: "General", ru: "Общее" },
  "privacy.s0.b": {
    az: "Imparo sənin şəxsi məlumatına önəm verir. Bu Məxfilik siyasəti onu necə topladığımızı, istifadə etdiyimizi və paylaşdığımızı izah edir və Imparo veb-saytı, tətbiqi və əlaqəli xidmətlərinə (“Xidmət”) aiddir. Xidmətdən istifadə etməklə bu siyasətə razılıq verirsən. Məlumatını satmırıq.",
    en: "Imparo cares about your personal information. This Privacy Policy explains how we collect, use and share it, and applies to the Imparo website, app and related services (the “Service”). By using the Service, you agree to this policy. We do not sell your data.",
    ru: "Imparo заботится о ваших персональных данных. Эта Политика конфиденциальности объясняет, как мы их собираем, используем и передаём, и применяется к сайту, приложению и связанным сервисам Imparo («Сервис»). Используя Сервис, вы соглашаетесь с этой политикой. Мы не продаём ваши данные.",
  },
  "privacy.s1.t": { az: "1. Topladığımız məlumatlar", en: "1. Information we collect", ru: "1. Какие данные мы собираем" },
  "privacy.s1.b": {
    az: "• Hesab: ad/istifadəçi adı, e-poçt, sinif; Google ilə girişdə provayderdən gələn profil məlumatı;\n• Profil: ad, avatar, öyrənmə statistikası, nailiyyətlər, dostlar/izləyicilər;\n• Öyrənmə: irəliləyiş, XP, seriya, zümrüd, can, cavablar, tamamlanan dərslər;\n• Texniki: cihaz/brauzer növü, IP ünvan, log və istifadə statistikası;\n• Ödəniş: Plus alınarsa ödəniş üçüncü tərəf provayder tərəfindən emal olunur — kart məlumatlarını biz saxlamırıq.",
    en: "• Account: name/username, email, grade; profile info from the provider if you sign in with Google;\n• Profile: name, avatar, learning stats, achievements, friends/followers;\n• Learning: progress, XP, streaks, gems, hearts, answers, completed lessons;\n• Technical: device/browser type, IP address, logs and usage statistics;\n• Payment: if you buy Plus, payment is processed by a third-party provider — we do not store card details.",
    ru: "• Аккаунт: имя/имя пользователя, эл. почта, класс; данные профиля от провайдера при входе через Google;\n• Профиль: имя, аватар, статистика обучения, достижения, друзья/подписчики;\n• Обучение: прогресс, XP, серии, кристаллы, жизни, ответы, пройденные уроки;\n• Технические: тип устройства/браузера, IP-адрес, логи и статистика использования;\n• Оплата: при покупке Plus платёж обрабатывается сторонним провайдером — данные карты мы не храним.",
  },
  "privacy.s2.t": { az: "2. Məlumatdan necə istifadə edirik", en: "2. How we use information", ru: "2. Как мы используем данные" },
  "privacy.s2.b": {
    az: "• Xidməti təqdim etmək, profilini və irəliləyişini saxlamaq;\n• Öyrənmə məzmununu fərdiləşdirmək;\n• Platformanı yaxşılaşdırmaq, xətaları düzəltmək, araşdırma aparmaq;\n• Təhlükəsizlik və sui-istifadənin qarşısını almaq;\n• Səninlə vacib məlumatlar barədə əlaqə saxlamaq.",
    en: "• To provide the Service and maintain your profile and progress;\n• To personalize learning content;\n• To improve the platform, fix bugs and do research;\n• For security and to prevent abuse;\n• To contact you about important matters.",
    ru: "• Для предоставления Сервиса и поддержки профиля и прогресса;\n• Для персонализации учебного контента;\n• Для улучшения платформы, исправления ошибок и исследований;\n• Для безопасности и предотвращения злоупотреблений;\n• Для связи с вами по важным вопросам.",
  },
  "privacy.s3.t": { az: "3. Kimlərlə paylaşırıq", en: "3. Who we share with", ru: "3. С кем мы делимся" },
  "privacy.s3.b": {
    az: "Məlumatı satmırıq. Xidməti təmin edən etibarlı provayderlərlə paylaşırıq:\n• Supabase — məlumat bazası və autentifikasiya;\n• PostHog (Aİ-də yerləşir) — istifadə analitikası; hesabınla və sinfinlə əlaqələndirilir (tam anonim deyil), platformanı yaxşılaşdırmaq üçün istifadə olunur;\n• Google — istəyə bağlı “Google ilə giriş”;\n• Ödəniş provayderi — Imparo Plus ödənişləri;\n• Cloudflare — sayt hostinqi və şəbəkə (bütün sorğular ondan keçir);\n• Resend — e-poçt göndərilməsi (valideyn hesabatı və təsdiq məktubları).\nHəmçinin qanuni tələb olduqda (məhkəmə qərarı və s.) və ya təhlükə/saxtakarlığın qarşısını almaq üçün lazım olduqda paylaşa bilərik.",
    en: "We do not sell data. We share it with trusted providers that run the Service:\n• Supabase — database and authentication;\n• PostHog (EU-based) — usage analytics; linked to your account and grade (not fully anonymous), used to improve the platform;\n• Google — optional “Sign in with Google”;\n• Payment provider — Imparo Plus payments;\n• Cloudflare — site hosting and network (all requests pass through it);\n• Resend — email delivery (parent reports and confirmation emails).\nWe may also share when legally required (court order, etc.) or to prevent harm/fraud.",
    ru: "Мы не продаём данные. Мы делимся ими с надёжными провайдерами, обеспечивающими Сервис:\n• Supabase — база данных и аутентификация;\n• PostHog (расположен в ЕС) — аналитика использования; связана с вашим аккаунтом и классом (не полностью анонимна), используется для улучшения платформы;\n• Google — опциональный «Вход через Google»;\n• Платёжный провайдер — платежи Imparo Plus;\n• Cloudflare — хостинг сайта и сеть (через неё проходят все запросы);\n• Resend — доставка писем (родительские отчёты и письма-подтверждения).\nМы также можем делиться при законных требованиях (судебный приказ и т. п.) или для предотвращения вреда/мошенничества.",
  },
  "privacy.s4.t": { az: "4. Profil və liqa", en: "4. Profile and league", ru: "4. Профиль и лига" },
  "privacy.s4.b": {
    az: "Profilin adın, avatarın və öyrənmə statistikanı göstərə bilər; dostlar bir-birini izləyə bilər. Liqa (leaderboard) həftəlik XP üzrə digər istifadəçilərlə sıralanmanı göstərir. E-poçt, telefon və parol heç vaxt profilində ictimai göstərilmir.",
    en: "Your profile may show your name, avatar and learning stats; friends can follow each other. The league (leaderboard) shows your weekly XP ranking among other users. Your email, phone and password are never shown publicly on your profile.",
    ru: "Ваш профиль может показывать имя, аватар и статистику обучения; друзья могут подписываться друг на друга. Лига (таблица лидеров) показывает ваш недельный рейтинг XP среди других. Эл. почта, телефон и пароль никогда не отображаются публично.",
  },
  "privacy.s5.t": { az: "5. Uşaq istifadəçilər", en: "5. Child users", ru: "5. Дети-пользователи" },
  "privacy.s5.b": {
    az: "Uşaqlar əlavə qoruma layiqdir — Imparo-nun bütün istifadəçiləri məktəblidir. Qeydiyyatda valideyn/müəllim nəzarətini təsdiqləyən bənd və könüllü valideyn e-poçtu sahəsi var. Reklam göstərmirik və məlumatı satmırıq. Liqa və profildə real ad görünür (bax bölmə 4) — bunu istəmirsənsə, adını dəyişə bilərsən. Valideyn/qəyyum kimi uşağının hesabına (onun öz girişi ilə) daxil olub Ayarlar bölməsindən məlumatını yükləyə və ya hesabı silə bilərsən; bunu edə bilmirsənsə, bizə yaz (bölmə 14) — sorğunu araşdırıb icra edərik.",
    en: "Children deserve extra protection — every Imparo user is a school student. Signup includes a checkbox confirming parent/teacher supervision and an optional parent email field. We do not show ads and do not sell data. Your real name appears in the league and profile (see section 4) — you can change your display name if you'd rather not use your real one. As a parent/guardian, you can sign in with your child's own login and use Settings to download or delete their data; if you can't do that yourself, contact us (section 14) and we will action the request.",
    ru: "Дети заслуживают дополнительной защиты — все пользователи Imparo являются школьниками. При регистрации есть флажок, подтверждающий контроль родителя/учителя, и необязательное поле email родителя. Мы не показываем рекламу и не продаём данные. Ваше настоящее имя отображается в лиге и профиле (см. раздел 4) — вы можете изменить отображаемое имя. Как родитель/опекун вы можете войти под учётной записью ребёнка и в Настройках скачать или удалить его данные; если это невозможно самостоятельно, напишите нам (раздел 14) — мы выполним запрос.",
  },
  "privacy.s6.t": { az: "6. Imparo Məktəb (müəllimlər)", en: "6. Imparo for Schools (teachers)", ru: "6. Imparo для школ (учителя)" },
  "privacy.s6.b": {
    az: "Imparo Məktəb şagirdlərin virtual siniflərə qoşulmasına imkan verir. Sinfə qoşulsan, müəllim adını görə, tapşırıq verə və öyrənmə irəliləyişini (hansı dərsləri etdiyin, qazandığın XP) izləyə bilər. Yalnız tanıdığın müəllimlərin siniflərinə qoşul. İstənilən vaxt sinifdən çıxaraq müəllimin girişini ləğv edə bilərsən.",
    en: "Imparo for Schools lets students join virtual classes. If you join a class, the teacher can see your name, assign tasks and track your learning progress (which lessons you did, XP earned). Only join classes of teachers you know. You can leave a class at any time to revoke the teacher’s access.",
    ru: "Imparo для школ позволяет ученикам присоединяться к виртуальным классам. Если вы вступите в класс, учитель видит ваше имя, даёт задания и отслеживает прогресс (какие уроки вы прошли, полученный XP). Вступайте только в классы знакомых учителей. Вы можете покинуть класс в любое время, отозвав доступ учителя.",
  },
  "privacy.s7.t": { az: "7. Kommunikasiya", en: "7. Communications", ru: "7. Коммуникации" },
  "privacy.s7.b": {
    az: "E-poçtundan öyrənmə xatırlatmaları, dost fəaliyyəti və yeni funksiyalar barədə bildirişlər göndərmək üçün istifadə edə bilərik. Parol sıfırlama kimi zəruri mesajlar həmişə göndərilir.\n\nValideyn hesabatı (könüllü): Ayarlar bölməsində valideyn e-poçtu qeyd edilərsə, həmin ünvana hər həftə sənin öyrənmə xülasən göndərilir — məşq vaxtı, tamamlanan dərslər, doğruluq faizi, fənlər üzrə nəticə və çətinlik çəkdiyin mövzu. Ünvan TƏSDİQLƏNMƏYƏNƏ qədər heç nə göndərilmir; məktublar Resend vasitəsilə gedir. Bunu istənilən vaxt Ayarlardan silmək, valideyn isə məktubdakı linklə dayandırmaq olar.",
    en: "We may use your email to send learning reminders, friend activity and announcements about new features. Essential messages such as password resets are always sent.\n\nParent report (optional): if a parent email is added in Settings, a weekly summary of your learning is sent to that address — practice time, completed lessons, accuracy, results per subject and the topic you struggled with. Nothing is sent until the address is CONFIRMED; emails are delivered via Resend. You can remove it in Settings at any time, and the parent can stop it from the link in the email.",
    ru: "Мы можем использовать вашу почту для напоминаний об учёбе, активности друзей и анонсов новых функций. Обязательные сообщения (например, сброс пароля) отправляются всегда.\n\nРодительский отчёт (по желанию): если в настройках указана почта родителя, на неё еженедельно отправляется сводка твоей учёбы — время занятий, пройденные уроки, точность, результаты по предметам и тема, которая даётся трудно. Ничего не отправляется, пока адрес НЕ ПОДТВЕРЖДЁН; письма доставляются через Resend. Ты можешь удалить адрес в настройках в любой момент, а родитель — отключить письма по ссылке в письме.",
  },
  "privacy.s8.t": { az: "8. Kukilər və lokal yaddaş", en: "8. Cookies and local storage", ru: "8. Куки и локальное хранилище" },
  "privacy.s8.b": {
    az: "Girişi saxlamaq, seçimlərini yadda saxlamaq və təcrübəni yaxşılaşdırmaq üçün brauzerin lokal yaddaşından (localStorage) və zəruri kukilərdən istifadə edirik.",
    en: "We use the browser’s local storage (localStorage) and essential cookies to keep you signed in, remember your preferences and improve the experience.",
    ru: "Мы используем локальное хранилище браузера (localStorage) и необходимые куки, чтобы сохранять вход, запоминать настройки и улучшать работу.",
  },
  "privacy.s9.t": { az: "9. Saxlanma və təhlükəsizlik", en: "9. Retention and security", ru: "9. Хранение и безопасность" },
  "privacy.s9.b": {
    az: "Məlumatı ümumiyyətlə hesabın silinənə qədər saxlayırıq; qanuni tələb, mübahisə və ya sui-istifadənin araşdırılması üçün bəzi məlumatı daha uzun saxlaya bilərik. Anonim datanı müddətsiz saxlaya bilərik. Sənaye standartı təhlükəsizlik tədbirləri tətbiq edirik, lakin internetdə heç bir sistem 100% təhlükəsiz deyil.",
    en: "We generally keep data until your account is deleted; we may keep some data longer for legal requirements, disputes or investigating misuse. We may keep anonymous data indefinitely. We apply industry-standard security, but no system on the internet is 100% secure.",
    ru: "Обычно мы храним данные до удаления аккаунта; часть данных можем хранить дольше для юридических требований, споров или расследования злоупотреблений. Анонимные данные можем хранить бессрочно. Мы применяем отраслевую безопасность, но ни одна система не защищена на 100%.",
  },
  "privacy.s10.t": { az: "10. Hüquqların", en: "10. Your rights", ru: "10. Ваши права" },
  "privacy.s10.b": {
    az: "Öz məlumatına baxmaq, nüsxəsini almaq (export), düzəltmək və ya silmək; emalına etiraz etmək; razılığı geri götürmək hüququn var. Bu hüquqları həyata keçirmək və ya hesabını silmək üçün platformadakı Ayarlardan istifadə et və ya bizə yaz.",
    en: "You have the right to access, get a copy of (export), correct or delete your data; object to processing; and withdraw consent. To exercise these rights or delete your account, use Settings on the platform or write to us.",
    ru: "Вы вправе получить доступ, копию (экспорт), исправить или удалить данные; возражать против обработки; отозвать согласие. Чтобы воспользоваться правами или удалить аккаунт, используйте настройки на платформе или напишите нам.",
  },
  "privacy.s11.t": { az: "11. Məlumatın yerləşməsi və ötürülməsi", en: "11. Data location and transfer", ru: "11. Расположение и передача данных" },
  "privacy.s11.b": {
    az: "Məlumatlar bulud provayderlərimizin (məs. Supabase) serverlərində saxlanılır və emal edilir; bu serverlər sənin ölkəndən kənarda (məs. Aİ) yerləşə bilər. Xidmətdən istifadə etməklə məlumatının bu cür ötürülməsinə və saxlanmasına razılıq verirsən.",
    en: "Data is stored and processed on our cloud providers’ servers (e.g. Supabase), which may be located outside your country (e.g. the EU). By using the Service, you consent to such transfer and storage of your data.",
    ru: "Данные хранятся и обрабатываются на серверах наших облачных провайдеров (например, Supabase), которые могут находиться за пределами вашей страны (например, в ЕС). Используя Сервис, вы соглашаетесь на такую передачу и хранение данных.",
  },
  "privacy.s12.t": { az: "12. Üçüncü tərəf linkləri", en: "12. Third-party links", ru: "12. Ссылки третьих лиц" },
  "privacy.s12.b": {
    az: "Xidmət başqa saytlara link ehtiva edə bilər. Onların məzmununa və ya məxfilik təcrübələrinə görə cavabdeh deyilik. Bu siyasət yalnız Imparo-nun topladığı məlumata aiddir. Üçüncü tərəf sayta keçəndə həmin tərəfin siyasəti tətbiq olunur.",
    en: "The Service may contain links to other sites. We are not responsible for their content or privacy practices. This policy applies only to data collected by Imparo. When you go to a third-party site, that party’s policy applies.",
    ru: "Сервис может содержать ссылки на другие сайты. Мы не отвечаем за их контент или практики конфиденциальности. Эта политика применяется только к данным, собранным Imparo. При переходе на сторонний сайт действует его политика.",
  },
  "privacy.s13.t": { az: "13. Dəyişikliklər", en: "13. Changes", ru: "13. Изменения" },
  "privacy.s13.b": {
    az: "Bu siyasəti yeniləyə bilərik. Əhəmiyyətli dəyişikliklər barədə platformada məlumat verir və aşağıda son yenilənmə tarixini göstəririk.",
    en: "We may update this policy. We will announce significant changes on the platform and indicate the last revised date below.",
    ru: "Мы можем обновлять эту политику. О существенных изменениях мы сообщим на платформе и укажем дату последней редакции ниже.",
  },
  "privacy.s14.t": { az: "14. Data nəzarətçisi və əlaqə", en: "14. Data controller and contact", ru: "14. Контролёр данных и контакты" },
  "privacy.s14.b": {
    az: "Məlumatının nəzarətçisi Imparo-dur. Məxfiliklə bağlı istənilən sual və ya sorğu üçün: mexfilik@imparo.app.",
    en: "The controller of your data is Imparo. For any privacy question or request: mexfilik@imparo.app.",
    ru: "Контролёр ваших данных — Imparo. По любым вопросам или запросам о конфиденциальности: mexfilik@imparo.app.",
  },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "az";
  try {
    const p = JSON.parse(localStorage.getItem("imparo-prefs") || "{}");
    return (p.lang as Lang) || "az";
  } catch {
    return "az";
  }
}

export function t(key: string, lang: Lang = getLang()): string {
  return DICT[key]?.[lang] ?? DICT[key]?.az ?? key;
}

// Açar sözlükdə varmı? Naməlum id-lər (məs. admin paneldən yaradılmış bölmələr)
// üçün xam açar əvəzinə DB başlığına düşmək qərarında istifadə olunur.
export function hasKey(key: string): boolean {
  return key in DICT;
}

// Hydration-təhlükəsiz: server və hidrasiya "az", sonra real dil.
// useSyncExternalStore hidrasiya uyğunsuzluğu vermədən localStorage dilini oxuyur
// və "imparo-lang" / storage hadisələrində yenilənir.
function subscribeLang(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener("imparo-lang", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("imparo-lang", cb);
  };
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, () => "az" as Lang);
}

export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => t(key, lang);
}
