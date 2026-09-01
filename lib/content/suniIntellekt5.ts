// Süni İntellekt — 5-ci sinif proqramı (pilot fənn).
// Bölmələr: 1) Süni intellekt nədir və necə öyrənir  2) Gündəlik həyatda Aİ
// 3) Aİ-yə nə vaxt inanmamalı (uydurma cavab, deepfake, məxfilik).
// id prefiksi ai5-*.
//
// Yanaşma: 10-11 yaşlı şagird üçün Aİ "sehr" kimi yox, NÜMUNƏDƏN ÖYRƏNƏN PROQRAM
// kimi izah olunur. Ona görə hər bölmə bir bacarıqla bitir: tanı → istifadə et →
// yoxla. Sonuncu bölmə qəsdən tənqidi düşüncəyə həsr olunub: uşaq Aİ-dən istifadə
// etməyi yox, ona NƏ VAXT İNANMAMAĞI öyrənməlidir.

import type { Subject } from "../types";

export const suniIntellekt5: Subject = {
  slug: "suni-intellekt-5",
  name: "Süni İntellekt",
  grade: 5,
  icon: "S",
  color: "violet",
  units: [
    // ═══════════════ 1. Süni intellekt nədir? ═══════════════
    {
      id: "ai5-nedir",
      title: "Süni intellekt nədir?",
      description: "Aİ nə deməkdir, adi proqramdan nə ilə fərqlənir və necə öyrənir.",
      lessons: [
        {
          id: "ai5-nedir-l1",
          title: "Aİ nədir?",
          intro: "Süni intellekt — insan kimi düşünən yox, nümunələrdən öyrənən proqramdır.",
          sections: [
            { heading: "Tərif", body: "Süni intellekt (Aİ) — kompüterin şəkil tanımaq, mətn yazmaq, səsi başa düşmək kimi işləri NÜMUNƏLƏRDƏN öyrənərək görməsidir. Beyni yoxdur, hissləri yoxdur — riyaziyyat və çoxlu nümunə var." },
            { heading: "Adi proqramdan fərqi", body: "Adi proqrama hər addımı sən yazırsan: 'əgər belədirsə, bunu et'. Aİ-yə isə minlərlə nümunə verirsən və o, qaydanı ÖZÜ tapır. Ona görə də bəzən səhv edir — qaydanı bizim yazdığımız kimi yox, nümunələrdən çıxarıb." },
          ],
          tasks: [
            { id: "ai5-nedir-l1-t1", type: "multiple_choice", prompt: "Süni intellekt nədir?", options: ["Nümunələrdən öyrənən proqram", "Canlı bir varlıq", "Robotun bədəni", "İnternetin adı"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t2", type: "multiple_choice", prompt: "Aİ adi proqramdan nə ilə fərqlənir?", options: ["Qaydanı nümunələrdən özü tapır", "Daha sürətli yüklənir", "Rəngi fərqlidir", "İnternet tələb etmir"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t3", type: "multiple_choice", prompt: "Aİ-nin hissləri (sevinc, kədər) varmı?", options: ["Yoxdur", "Bəli, insan kimi", "Yalnız gecə", "Bəzən var"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t4", type: "multiple_choice", prompt: "Aşağıdakılardan hansı Aİ nümunəsidir?", options: ["Şəkildəki heyvanı tanıyan proqram", "Kalkulyatorda 2+2", "Saatın əqrəbi", "Kitabın səhifəsi"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t5", type: "fill_blank", prompt: "Aİ qaydanı özü ______ tapır (bir söz: nümunələrdən/nümunelerden).", accepted: ["nümunələrdən", "numunelerden", "nümunələrdən öyrənir"], xp: 10 },
            { id: "ai5-nedir-l1-t6", type: "multiple_choice", prompt: "Niyə Aİ bəzən səhv edir?", options: ["Qaydanı nümunələrdən çıxarır, nümunə az/səhv ola bilər", "Çünki yorulur", "Çünki internet yavaşdır", "Çünki elektrik azdır"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t7", type: "multiple_choice", prompt: "'Aİ hər şeyi bilir' fikri doğrudurmu?", options: ["Xeyr, yalnız öyrəndiyi qədər bilir", "Bəli, hər şeyi bilir", "Bəli, çünki kompüterdir", "Yalnız riyaziyyatda bilmir"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t8", type: "multiple_choice", prompt: "Robot və süni intellekt eyni şeydirmi?", options: ["Xeyr — robot bədəndir, Aİ isə proqramdır", "Bəli, tam eynidir", "Robot Aİ-nin köhnə adıdır", "Aİ robotun rəngidir"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t9", type: "multiple_choice", prompt: "Aİ-ni işlətmək üçün ən vacib şey nədir?", options: ["Çoxlu nümunə (məlumat)", "Böyük ekran", "Yeni klaviatura", "Sürətli printer"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l1-t10", type: "multiple_choice", prompt: "Aşağıdakılardan hansı Aİ DEYİL?", options: ["Yalnız 'əgər-onda' qaydaları ilə işləyən kalkulyator", "Səsi mətnə çevirən proqram", "Şəkildəki üzü tanıyan proqram", "Cümlə yazan söhbət proqramı"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-nedir-l1-b1", type: "multiple_choice", prompt: "Bir dost deyir: 'Aİ hər şeyi başa düşür'. Ən düzgün cavab hansıdır?", options: ["O, sözlərin mənasını insan kimi 'başa düşmür', ehtimal hesablayır", "Doğrudur, hər şeyi başa düşür", "Yalnız ingiliscə başa düşür", "Yalnız böyüklərin sözünü başa düşür"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l1-b2", type: "multiple_choice", prompt: "Aİ-yə 'ağıllı' deməyimiz nə deməkdir?", options: ["Bəzi işləri insan kimi yaxşı görə bilir", "Şüuru və istəkləri var", "Öz-özünə qərar verib məktəbə gedir", "Yatıb dincəlir"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l1-b3", type: "multiple_choice", prompt: "Aİ-nin öyrənməsi üçün nümunələr HARADAN gəlir?", options: ["İnsanların topladığı məlumatlardan", "Kosmosdan", "Öz-özündən yaranır", "Batareyadan"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l1-b4", type: "multiple_choice", prompt: "Nümunələr səhv olsa nə baş verər?", options: ["Aİ də səhv öyrənər", "Heç nə dəyişməz", "Aİ daha sürətli olar", "Aİ nümunəni özü düzəldər"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-nedir-l2",
          title: "Maşın necə öyrənir?",
          intro: "Aİ-yə minlərlə nümunə göstərirsən — o, ortaq əlaməti tapır.",
          sections: [
            { heading: "Nümunə → qayda", body: "Aİ-yə 10 min pişik və 10 min it şəkli göstərirsən. O, hansı şəklin nəyə oxşadığını riyazi olaraq ölçür və yeni şəkil gələndə 'bu, pişikə daha çox oxşayır' deyir. Heç kim ona 'pişiyin bığı olur' qaydasını yazmır." },
            { heading: "Öyrətmə və yoxlama", body: "Nümunələrin bir hissəsi öyrətmək, bir hissəsi YOXLAMAQ üçün ayrılır. Əgər proqram yalnız gördüyü şəkilləri tanıyırsa, deməli əzbərləyib — bu, pis öyrənmədir." },
          ],
          tasks: [
            { id: "ai5-nedir-l2-t1", type: "multiple_choice", prompt: "Aİ pişiyi itdən necə ayırd etməyi öyrənir?", options: ["Çoxlu şəkil nümunəsi görərək", "Lüğətdən oxuyaraq", "Sahibindən soruşaraq", "Səsə görə həmişə"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t2", type: "multiple_choice", prompt: "Nümunələr niyə çox olmalıdır?", options: ["Nə qədər çox nümunə, bir o qədər dəqiq qayda", "Yer tutmaq üçün", "Ekranı doldurmaq üçün", "Səsi artırmaq üçün"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t3", type: "multiple_choice", prompt: "Aİ yalnız gördüyü şəkilləri tanıyırsa, bu nə deməkdir?", options: ["Əzbərləyib, düzgün öyrənməyib", "Çox yaxşı öyrənib", "Sürətli işləyir", "Yaddaşı azdır"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t4", type: "multiple_choice", prompt: "Nümunələrin bir hissəsi niyə yoxlama üçün ayrılır?", options: ["Yeni şəkildə də işlədiyini yoxlamaq üçün", "Yer qənaəti üçün", "Rəngi yoxlamaq üçün", "Sürəti artırmaq üçün"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t5", type: "numeric", prompt: "1000 şəklin 800-ü öyrətməyə ayrılıb. Yoxlamaya neçəsi qalır?", answer: 200, xp: 10 },
            { id: "ai5-nedir-l2-t6", type: "multiple_choice", prompt: "Aİ-yə yalnız ağ pişik şəkilləri göstərsək nə olar?", options: ["Qara pişiyi tanımaqda çətinlik çəkər", "Bütün pişikləri mükəmməl tanıyar", "İtləri daha yaxşı tanıyar", "Heç nə dəyişməz"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t7", type: "fill_blank", prompt: "Aİ-nin öyrənməsi üçün lazım olan şəkil, mətn və səslərə bir sözlə ______ deyilir.", accepted: ["məlumat", "melumat", "data", "nümunə", "numune"], xp: 10 },
            { id: "ai5-nedir-l2-t8", type: "multiple_choice", prompt: "Aİ 'səhv etdi' — ən düzgün izah hansıdır?", options: ["Nümunələrdən çıxardığı qayda bu halda uyğun gəlmədi", "Aİ qəsdən aldatdı", "Aİ küsdü", "Aİ yoruldu"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t9", type: "multiple_choice", prompt: "İnsan uşağı ilə Aİ-nin öyrənməsi arasında əsas fərq nədir?", options: ["Uşaq bir neçə nümunə ilə anlayır, Aİ-yə minlərlə lazımdır", "Uşaq heç öyrənmir", "Aİ daha az nümunə ilə öyrənir", "Fərq yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l2-t10", type: "multiple_choice", prompt: "Aşağıdakılardan hansı 'öyrətmə məlumatı' ola bilər?", options: ["Minlərlə etiketlənmiş şəkil", "Kompüterin rəngi", "Klaviaturanın markası", "Otağın istiliyi"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-nedir-l2-b1", type: "multiple_choice", prompt: "'Etiketlənmiş məlumat' nə deməkdir?", options: ["Hər nümunənin nə olduğu yazılıb (bu pişikdir, bu itdir)", "Məlumatın rəngli olması", "Faylın adının uzun olması", "Şəkildə yazı olması"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l2-b2", type: "multiple_choice", prompt: "Yalnız oğlan şəkilləri ilə öyrədilən Aİ qız şəklində nə edər?", options: ["Daha çox səhv edər — məlumat qərəzlidir", "Daha dəqiq işləyər", "Heç bir fərq olmaz", "Şəkli silər"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l2-b3", type: "multiple_choice", prompt: "Aİ 'əmin deyiləm' deyə bilirmi?", options: ["Bəli — hər cavabın ehtimalı var", "Xeyr, həmişə tam əmindir", "Yalnız səhv edəndə", "Yalnız gecə"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l2-b4", type: "numeric", prompt: "Aİ 200 şəkildən 180-ni düz tanıdı. Dəqiqliyi neçə faizdir?", answer: 90, xp: 15 },
          ],
        },
        {
          id: "ai5-nedir-l3",
          title: "Aİ nəyi bacarır, nəyi yox?",
          intro: "Aİ bəzi işlərdə güclüdür, bəzilərində isə insan əvəzsizdir.",
          sections: [
            { heading: "Güclü tərəfi", body: "Aİ yorulmadan, sürətlə və çoxlu məlumatla işləyir: mətn tərcümə edir, şəkil tanıyır, təkrarlanan işi dəqiq görür." },
            { heading: "Zəif tərəfi", body: "Aİ nəyin DOĞRU və ya ƏDALƏTLİ olduğunu bilmir. O, məsuliyyət daşımır, hisslərini başa düşmür və gerçək dünyanı görmür. Qərarı həmişə insan verməlidir." },
          ],
          tasks: [
            { id: "ai5-nedir-l3-t1", type: "multiple_choice", prompt: "Aİ hansı işdə güclüdür?", options: ["Minlərlə şəkli sürətlə yoxlamaqda", "Dostluq qurmaqda", "Kədəri anlamaqda", "Vicdanlı qərar verməkdə"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t2", type: "multiple_choice", prompt: "Aİ nəyi BACARMIR?", options: ["Nəyin ədalətli olduğuna qərar verməyi", "Mətn tərcümə etməyi", "Şəkil tanımağı", "Sürətlə hesablamağı"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t3", type: "multiple_choice", prompt: "Aİ səhv qərar verdi — məsuliyyət kimdədir?", options: ["Onu qurub istifadə edən insanlarda", "Aİ-nin özündə", "Heç kimdə", "Kompüterdə"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t4", type: "multiple_choice", prompt: "Həkim Aİ-nin köməyi ilə diaqnoz qoyur. Son qərarı kim verməlidir?", options: ["Həkim", "Aİ", "Kompüter", "Xəstəxananın proqramı"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t5", type: "multiple_choice", prompt: "Aİ yorulurmu?", options: ["Xeyr, amma səhv edə bilər", "Bəli, gecələr yatır", "Bəli, hər saat dincəlir", "Bəli, həftə sonu işləmir"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t6", type: "multiple_choice", prompt: "Aİ dost ola bilərmi?", options: ["Xeyr — hiss etmir, yalnız cavab yazır", "Bəli, ən yaxşı dostdur", "Bəli, çünki danışır", "Yalnız oyunlarda"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t7", type: "fill_blank", prompt: "Vacib qərarı həmişə ______ verməlidir (bir söz).", accepted: ["insan", "İnsan"], xp: 10 },
            { id: "ai5-nedir-l3-t8", type: "multiple_choice", prompt: "Aİ-nin işini yoxlamaq niyə lazımdır?", options: ["Çünki inamlı görünsə də səhv edə bilər", "Çünki yavaşdır", "Çünki bahadır", "Çünki səsi var"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t9", type: "multiple_choice", prompt: "Hansı iş üçün Aİ ƏN UYĞUNDUR?", options: ["Eyni tipli minlərlə sənədi çeşidləmək", "Dostunu təsəlli etmək", "Ailə qərarı vermək", "Şəxsi sirri saxlamaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-nedir-l3-t10", type: "multiple_choice", prompt: "Aİ gələcəkdə bütün işləri əvəz edəcəkmi?", options: ["Bəzi işləri dəyişəcək, insan tamamilə əvəz olunmayacaq", "Bəli, hamısını", "Xeyr, heç birini", "Yalnız idmanı"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-nedir-l3-b1", type: "multiple_choice", prompt: "Aİ-nin 'qərəz' (bias) problemi nə deməkdir?", options: ["Öyrədildiyi məlumat birtərəfli olduğu üçün nəticə də ədalətsiz olur", "Aİ-nin sürətinin az olması", "Ekranın rəngi", "Faylın böyüklüyü"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l3-b2", type: "multiple_choice", prompt: "Aİ ilə işləyən insanın ən vacib bacarığı nədir?", options: ["Nəticəni yoxlamaq və şübhə etmək", "Sürətli yazmaq", "Yüksək səslə danışmaq", "Çox oyun oynamaq"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l3-b3", type: "multiple_choice", prompt: "Niyə Aİ məhkəmədə tək başına hökm verə bilməz?", options: ["Ədaləti anlamır və məsuliyyət daşımır", "Yavaş işlədiyi üçün", "Bahalı olduğu üçün", "İnternet lazım olduğu üçün"], correctIndex: 0, xp: 15 },
            { id: "ai5-nedir-l3-b4", type: "multiple_choice", prompt: "'Aİ köməkçidir, əvəzedici deyil' — bu nə deməkdir?", options: ["İşi asanlaşdırır, amma qərar və məsuliyyət insandadır", "Aİ heç nəyə yaramır", "İnsan artıq lazım deyil", "Aİ yalnız oyun üçündür"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-nedir-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Buraya çatdın! Sandığı aç və mükafatını al.",
          tasks: [],
        },
        {
          id: "ai5-nedir-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Bu bölmədə öyrəndiklərini yoxla — suallar bütün dərslərdən qarışıq gəlir.",
          tasks: [],
        },
      ],
    },

    // ═══════════════ 2. Gündəlik həyatda süni intellekt ═══════════════
    {
      id: "ai5-gundelik",
      title: "Gündəlik həyatda Aİ",
      description: "Telefonda, oyunda, dərsdə — Aİ artıq hər gün yanındadır.",
      lessons: [
        {
          id: "ai5-gundelik-l1",
          title: "Tövsiyə sistemləri",
          intro: "YouTube və oxşar tətbiqlər sənə nəyi göstərəcəyini Aİ ilə seçir.",
          sections: [
            { heading: "Necə işləyir?", body: "Tətbiq nəyə baxdığını, nə qədər baxdığını və nəyi bəyəndiyini ölçür. Sonra sənə oxşayan başqa istifadəçilərin bəyəndiyini təklif edir. Buna TÖVSİYƏ SİSTEMİ deyilir." },
            { heading: "Diqqət", body: "Tövsiyə sistemi sənin xeyrini yox, EKRANDA QALMA VAXTINI artırmağa çalışır. Ona görə 'bir video daha' deyib saatlarla qala bilərsən. Vaxtı özün idarə et." },
          ],
          tasks: [
            { id: "ai5-gundelik-l1-t1", type: "multiple_choice", prompt: "Tövsiyə sistemi nəyə əsaslanır?", options: ["Sənin baxış və bəyənmə tarixçənə", "Havanın temperaturuna", "Telefonun rənginə", "Ad gününə"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t2", type: "multiple_choice", prompt: "Tövsiyə sisteminin əsas məqsədi nədir?", options: ["Səni tətbiqdə daha uzun saxlamaq", "Sənə dərs öyrətmək", "Telefonu təmizləmək", "Batareyanı qorumaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t3", type: "multiple_choice", prompt: "Bir video izlədin, sonra oxşarları gəldi. Səbəb nədir?", options: ["Aİ maraq dairəni təxmin etdi", "Təsadüfdür", "Dostun göndərdi", "Telefon qızdı"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t4", type: "multiple_choice", prompt: "Ekran vaxtını idarə etmək üçün ən yaxşı addım hansıdır?", options: ["Özünə vaxt limiti qoymaq", "Daha çox video izləmək", "Bildirişləri artırmaq", "Gecə də izləmək"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t5", type: "multiple_choice", prompt: "Tövsiyələr həmişə doğru/faydalı olurmu?", options: ["Xeyr — populyar olan həmişə düzgün deyil", "Bəli, həmişə faydalıdır", "Bəli, çünki Aİ seçir", "Yalnız səhər doğrudur"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t6", type: "fill_blank", prompt: "Sənə video seçən sistemə ______ sistemi deyilir (bir söz).", accepted: ["tövsiyə", "tovsiye", "təklif"], xp: 10 },
            { id: "ai5-gundelik-l1-t7", type: "multiple_choice", prompt: "Onlayn mağaza 'bunu da bəyənə bilərsən' deyir. Bu nədir?", options: ["Tövsiyə sistemi", "Reklam qadağası", "Antivirus", "Oyun rejimi"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t8", type: "numeric", prompt: "Gündə 3 saat video izləyirsən. Həftədə (7 gün) neçə saat edir?", answer: 21, xp: 10 },
            { id: "ai5-gundelik-l1-t9", type: "multiple_choice", prompt: "Maraqlarını dəyişmək üçün nə edə bilərsən?", options: ["Baxış tarixçəsini/marağı dəyişmək, yeni mövzu axtarmaq", "Telefonu silkələmək", "Ekranı söndürmək", "Səsi artırmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l1-t10", type: "multiple_choice", prompt: "Tövsiyə sistemi sənin haqqında nə bilir?", options: ["Nəyə, nə qədər baxdığını", "Ad gününü mütləq", "Ev ünvanını mütləq", "Sinif yoldaşlarının adını"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-gundelik-l1-b1", type: "multiple_choice", prompt: "'Filtr balonu' nə deməkdir?", options: ["Yalnız oxşar fikirləri görüb dünyanı dar tanımaq", "İnternetin sürətlənməsi", "Şəklin bulanıqlaşması", "Səsin azalması"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l1-b2", type: "multiple_choice", prompt: "Avtomatik oynatma (autoplay) niyə söndürülə bilər?", options: ["Vaxtı özün idarə edəsən deyə", "İnternet sürəti üçün", "Batareya üçün heç nə dəyişmir", "Səs keyfiyyəti üçün"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l1-b3", type: "multiple_choice", prompt: "Tövsiyə sisteminin işi üçün nə lazımdır?", options: ["İstifadəçilər haqqında məlumat", "Yeni monitor", "Printer", "Klaviatura"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l1-b4", type: "multiple_choice", prompt: "Sənə maraqlı olmayan tövsiyələr gəlirsə nə edə bilərsən?", options: ["'Maraqlı deyil' deyib rəy vermək", "Telefonu yeniləmək", "Hesabı silmək", "Heç nə etmək olmaz"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-gundelik-l2",
          title: "Səs, şəkil və tərcümə",
          intro: "Səsi tanıyan, tərcümə edən, şəkli təsvir edən proqramlar da Aİ-dir.",
          sections: [
            { heading: "Nümunələr", body: "Telefonun səs köməkçisi, kameranın üzü tanıması, xarici yazını tərcümə edən tətbiq, səsli mesajı mətnə çevirən funksiya — hamısı Aİ ilə işləyir." },
            { heading: "Faydası və həddi", body: "Bu vasitələr işi asanlaşdırır, amma tərcümə səhv ola bilər, üz tanıma başqasını sənə oxşada bilər. Mühüm halda insan yoxlamalıdır." },
          ],
          tasks: [
            { id: "ai5-gundelik-l2-t1", type: "multiple_choice", prompt: "Səsli köməkçi (məs. telefon köməkçisi) nə edir?", options: ["Səsi tanıyıb əmri yerinə yetirir", "Telefonu sərinləşdirir", "Batareyanı doldurur", "Ekranı təmizləyir"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t2", type: "multiple_choice", prompt: "Kameranın üzü tanıması hansı texnologiyadır?", options: ["Şəkil tanıma (Aİ)", "Radio", "Printer", "Bluetooth"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t3", type: "multiple_choice", prompt: "Maşın tərcüməsi həmişə dəqiqdirmi?", options: ["Xeyr, xüsusən deyim və zarafatlarda səhv edir", "Bəli, həmişə mükəmməldir", "Yalnız gecə səhv edir", "Yalnız uzun mətndə doğrudur"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t4", type: "multiple_choice", prompt: "Səsli axtarış nə vaxt faydalıdır?", options: ["Əlin məşğul olanda və ya yazmaq çətin olanda", "Yalnız gecə", "Yalnız internet olmayanda", "Heç vaxt"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t5", type: "multiple_choice", prompt: "Üz tanıma səhv edərsə nə ola bilər?", options: ["Başqa adamı sənin yerinə tanıya bilər", "Telefon yanar", "İnternet kəsilər", "Şəkil silinər"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t6", type: "fill_blank", prompt: "Səsi mətnə çevirən funksiyaya ______ tanıma deyilir (bir söz).", accepted: ["səs", "ses", "nitq"], xp: 10 },
            { id: "ai5-gundelik-l2-t7", type: "multiple_choice", prompt: "Tərcümə tətbiqindən dərsdə necə düzgün istifadə etmək olar?", options: ["Söz öyrənmək üçün kömək kimi, hazır cavab kimi yox", "Bütün tapşırığı ona yazdırmaqla", "Müəllimə deməyərək", "Heç istifadə etməməklə"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t8", type: "multiple_choice", prompt: "Şəkil tanıyan Aİ nədən öyrənir?", options: ["Milyonlarla etiketlənmiş şəkildən", "Bir şəkildən", "Səsdən", "Klaviaturadan"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t9", type: "multiple_choice", prompt: "Aİ ilə işləyən xəritə tətbiqi nəyi təxmin edir?", options: ["Yolun nə qədər çəkəcəyini", "Havanın rəngini", "Sənin yaşını", "Telefonun qiymətini"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l2-t10", type: "multiple_choice", prompt: "Səsli köməkçi hər zaman dinləyirmi?", options: ["Oyanma sözünü gözləyir — ayarlardan idarə etmək olar", "Xeyr, heç vaxt", "Bəli, hər şeyi yazıb saxlayır", "Yalnız zəng zamanı"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-gundelik-l2-b1", type: "multiple_choice", prompt: "Səsli köməkçiyə şəxsi məlumat (parol, kart nömrəsi) demək düzgündürmü?", options: ["Xeyr", "Bəli, təhlükəsizdir", "Yalnız evdə", "Yalnız gecə"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l2-b2", type: "multiple_choice", prompt: "Aİ tərcüməsini necə yoxlaya bilərsən?", options: ["Geri tərcümə edib mənasına baxmaqla", "Səsi artırmaqla", "Şrifti dəyişməklə", "Ekranı böyütməklə"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l2-b3", type: "multiple_choice", prompt: "Üz tanıma texnologiyası niyə mübahisəlidir?", options: ["İnsanların icazəsi olmadan izlənməsinə imkan verə bilər", "Çox yer tutur", "Bahalıdır", "Yavaş işləyir"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l2-b4", type: "multiple_choice", prompt: "Aİ ilə işləyən altyazı (subtitr) kimlərə xüsusilə kömək edir?", options: ["Eşitmə çətinliyi olanlara", "Yalnız uşaqlara", "Yalnız müəllimlərə", "Heç kimə"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-gundelik-l3",
          title: "Aİ köməkçisi ilə necə işləmək?",
          intro: "Yaxşı sual ver, cavabı yoxla, işini özün et.",
          sections: [
            { heading: "Yaxşı sual", body: "Aİ-yə nə istədiyini AYDIN de: mövzu, uzunluq, kim üçün. 'Kömək et' yerinə '5-ci sinif üçün fotosintezi 3 cümlə ilə izah et' daha yaxşı nəticə verir." },
            { heading: "Dürüstlük qaydası", body: "Aİ-nin yazdığını olduğu kimi köçürüb 'mən yazdım' demək düzgün deyil. Aİ-dən öyrənmək üçün istifadə et: izah istə, sonra öz sözlərinlə yaz." },
          ],
          tasks: [
            { id: "ai5-gundelik-l3-t1", type: "multiple_choice", prompt: "Hansı sual daha yaxşı nəticə verər?", options: ["'Fotosintezi 5-ci sinif üçün 3 cümlə ilə izah et'", "'Kömək et'", "'Nəsə yaz'", "'Bilirsən?'"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t2", type: "multiple_choice", prompt: "Aİ-nin cavabını nə etmək lazımdır?", options: ["Yoxlamaq və öz sözlərinlə yazmaq", "Olduğu kimi köçürmək", "Heç oxumamaq", "Dostuna satmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t3", type: "multiple_choice", prompt: "Ev tapşırığını tam Aİ-yə yazdırmaq niyə pisdir?", options: ["Sən öyrənmirsən və bu, dürüst deyil", "Çox vaxt aparır", "İnternet xərcləyir", "Müəllim sevinir"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t4", type: "multiple_choice", prompt: "Aİ-yə sual verəndə nəyi göstərmək faydalıdır?", options: ["Kim üçün və nə qədər uzunluqda olduğunu", "Telefonun modelini", "Otağın rəngini", "Saatı"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t5", type: "multiple_choice", prompt: "Aİ cavabı başa düşmədin. Ən yaxşı addım?", options: ["'Daha sadə izah et' deyib yenidən soruşmaq", "Bağlayıb getmək", "Kopyalayıb təhvil vermək", "Dostuna göndərmək"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t6", type: "fill_blank", prompt: "Aİ-yə verdiyimiz göstərişə ingiliscədən gələn sözlə ______ deyilir (prompt).", accepted: ["prompt", "sorğu", "sorgu", "göstəriş"], xp: 10 },
            { id: "ai5-gundelik-l3-t7", type: "multiple_choice", prompt: "Aİ-yə hansı məlumatı VERMƏMƏLİSƏN?", options: ["Ünvan, parol, kart nömrəsi", "Dərsin mövzusunu", "Sualın uzunluğunu", "Sinfini"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t8", type: "multiple_choice", prompt: "Aİ riyaziyyat məsələsini həll etdi. Nə etməlisən?", options: ["Addımları anlayıb özün yenidən həll etməlisən", "Cavabı köçürməlisən", "Heç nə", "Müəllimə deməməlisən"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t9", type: "multiple_choice", prompt: "Aİ-dən istifadə etdiyini müəllimə demək lazımdırmı?", options: ["Bəli, dürüstlük tələb edir", "Xeyr, gizlətmək lazımdır", "Yalnız səhv olsa", "Fərqi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ai5-gundelik-l3-t10", type: "multiple_choice", prompt: "Aİ-nin ən yaxşı istifadəsi hansıdır?", options: ["Anlamadığın mövzunu izah etdirmək", "Bütün işi ona etdirmək", "Dostlarını aldatmaq", "Sinif yoldaşının adından yazmaq"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-gundelik-l3-b1", type: "multiple_choice", prompt: "Aİ sənə iki fərqli cavab verdi. Nə edərsən?", options: ["Etibarlı mənbədən yoxlayaram", "Birincini seçərəm", "Sonuncunu seçərəm", "Hər ikisini yazaram"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l3-b2", type: "multiple_choice", prompt: "'Aİ ilə yazılmış inşa'nı öz adına təqdim etmək nədir?", options: ["Akademik dürüstlüyün pozulması", "Ağıllı üsul", "Yeni bacarıq", "Müəllim tapşırığı"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l3-b3", type: "multiple_choice", prompt: "Aİ-yə 'mənbə göstər' demək niyə faydalıdır?", options: ["Cavabı yoxlaya bilirsən", "Cavab qısalır", "Sürət artır", "Rəng dəyişir"], correctIndex: 0, xp: 15 },
            { id: "ai5-gundelik-l3-b4", type: "multiple_choice", prompt: "Aİ ilə öyrənməyin ən yaxşı üsulu hansıdır?", options: ["Sual ver → izah al → özün məşq et", "Cavabı köçür", "Heç istifadə etmə", "Yalnız oyun oyna"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-gundelik-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Əla gedirsən! Sandığı aç.",
          tasks: [],
        },
        {
          id: "ai5-gundelik-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Gündəlik həyatda Aİ — bildiklərini yoxla.",
          tasks: [],
        },
      ],
    },

    // ═══════════════ 3. Aİ-yə nə vaxt inanmamalı ═══════════════
    {
      id: "ai5-inan",
      title: "Aİ-yə nə vaxt inanmamalı?",
      description: "Uydurma cavab, deepfake və məxfilik — tənqidi düşüncə bacarığı.",
      lessons: [
        {
          id: "ai5-inan-l1",
          title: "Uydurma cavablar",
          intro: "Aİ bilmədiyini də çox inamlı şəkildə yaza bilər.",
          sections: [
            { heading: "Niyə uydurur?", body: "Aİ cavabı 'axtarıb tapmır' — növbəti sözü EHTİMALA görə seçir. Ona görə mövcud olmayan kitab adı, yanlış tarix və ya uydurma fakt yaza bilər. Buna 'uydurma cavab' (hallüsinasiya) deyilir." },
            { heading: "Necə yoxlamalı?", body: "Rəqəm, tarix, ad və mənbə varsa — mütləq başqa yerdən yoxla: dərslik, rəsmi sayt, müəllim. Aİ-nin inamlı tonu doğruluq demək deyil." },
          ],
          tasks: [
            { id: "ai5-inan-l1-t1", type: "multiple_choice", prompt: "Aİ bəzən uydurma cavab verir. Niyə?", options: ["Növbəti sözü ehtimalla seçir, faktı bilmir", "Qəsdən aldadır", "Yorulduğu üçün", "İnternet yavaş olduğu üçün"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t2", type: "multiple_choice", prompt: "Aİ inamlı danışırsa, cavab doğrudurmu?", options: ["Mütləq deyil — inam doğruluq demək deyil", "Bəli, həmişə", "Bəli, əgər uzundursa", "Bəli, əgər sürətlidirsə"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t3", type: "multiple_choice", prompt: "Aİ sənə tarix dedi. Nə etməlisən?", options: ["Dərslik və ya etibarlı saytdan yoxlamaq", "Dərhal yazmaq", "Dostuna göndərmək", "Unutmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t4", type: "multiple_choice", prompt: "Hansı cavabı ƏN ÇOX yoxlamaq lazımdır?", options: ["Rəqəm, tarix və mənbə adı", "Salamlaşma", "Zarafat", "Rəng adı"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t5", type: "multiple_choice", prompt: "Aİ mövcud olmayan kitabın adını yazdı. Bu nədir?", options: ["Uydurma cavab (hallüsinasiya)", "Yeni kəşf", "Tərcümə", "Sürət problemi"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t6", type: "fill_blank", prompt: "Aİ-nin uydurduğu cavaba bir sözlə ______ deyilir (hallüsinasiya).", accepted: ["hallüsinasiya", "hallusinasiya", "uydurma"], xp: 10 },
            { id: "ai5-inan-l1-t7", type: "multiple_choice", prompt: "Ən etibarlı yoxlama üsulu hansıdır?", options: ["Rəsmi/etibarlı mənbə ilə müqayisə", "Aİ-yə yenidən soruşmaq", "Dostundan soruşmaq", "Şəkil axtarmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t8", type: "multiple_choice", prompt: "Aİ 'bilmirəm' deyə bilirmi?", options: ["Bəli, yaxşı hallarda deyir — bu, yaxşı əlamətdir", "Xeyr, heç vaxt", "Yalnız gecə", "Yalnız uzun sualda"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t9", type: "multiple_choice", prompt: "Referatına Aİ-nin verdiyi mənbəni yazmazdan əvvəl nə edirsən?", options: ["Mənbənin həqiqətən mövcud olduğunu yoxlayıram", "Dərhal yazıram", "Adını dəyişirəm", "Silirəm"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l1-t10", type: "multiple_choice", prompt: "Aİ-nin cavabı dərsliyə ziddirsə kimə inanırsan?", options: ["Dərsliyə/müəllimə, sonra yoxlayıram", "Aİ-yə", "Heç kimə", "Dostuma"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-inan-l1-b1", type: "multiple_choice", prompt: "Aİ niyə köhnə məlumat verə bilər?", options: ["Öyrədildiyi məlumat müəyyən tarixə qədərdir", "Çünki yavaşdır", "Çünki kiçikdir", "Çünki pulsuzdur"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l1-b2", type: "multiple_choice", prompt: "'Aİ mənbə göstərdi' — bu, cavabın doğru olduğunu sübut edirmi?", options: ["Xeyr, mənbə də uydurma ola bilər — açıb yoxla", "Bəli, tam sübut edir", "Yalnız ingiliscə mənbədə", "Yalnız uzun mənbədə"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l1-b3", type: "multiple_choice", prompt: "Eyni sualı Aİ-yə iki dəfə versən nə ola bilər?", options: ["Fərqli cavablar ala bilərsən", "Həmişə eyni cavab gəlir", "Cavab gəlməz", "Hesabın bağlanar"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l1-b4", type: "multiple_choice", prompt: "Sağlamlıqla bağlı sual üçün ən doğru davranış?", options: ["Aİ-yə yox, həkimə müraciət etmək", "Aİ-nin dediyini etmək", "Dostdan dərman istəmək", "İnternetdən dərman almaq"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-inan-l2",
          title: "Deepfake və saxta məzmun",
          intro: "Aİ ilə saxta şəkil, səs və video düzəltmək asanlaşıb.",
          sections: [
            { heading: "Deepfake nədir?", body: "Aİ ilə düzəldilən, real görünən saxta video/səsə DEEPFAKE deyilir. Məşhur adamın demədiyi sözü 'dediyi' kimi göstərə bilər." },
            { heading: "Necə tanımalı?", body: "Qeyri-təbii göz qırpma, dodaq-səs uyğunsuzluğu, qəribə əllər, kölgə səhvləri şübhə oyadır. Ən etibarlı yol: eyni xəbəri tanınmış mənbədə axtarmaq. Şübhəlisənsə — PAYLAŞMA." },
          ],
          tasks: [
            { id: "ai5-inan-l2-t1", type: "multiple_choice", prompt: "Deepfake nədir?", options: ["Aİ ilə düzəldilən saxta video/səs", "Yeni oyun növü", "Video sıxma üsulu", "İnternet sürəti"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t2", type: "multiple_choice", prompt: "Şübhəli videonu görəndə ilk addım nədir?", options: ["Paylaşmamaq və mənbəni yoxlamaq", "Dərhal paylaşmaq", "Bəyənmək", "Şərh yazmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t3", type: "multiple_choice", prompt: "Hansı əlamət saxta şəkilə şübhə yaradır?", options: ["Qəribə əllər, uyğunsuz kölgə", "Şəklin rəngli olması", "Şəklin böyük olması", "Şəkildə adam olması"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t4", type: "multiple_choice", prompt: "Xəbərin doğruluğunu necə yoxlayarsan?", options: ["Tanınmış xəbər saytlarında axtararaq", "Şəkli böyüdərək", "Səsi artıraraq", "Dostların şərhinə baxaraq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t5", type: "multiple_choice", prompt: "Sənin şəklindən icazəsiz saxta məzmun düzəldiblər. Nə edirsən?", options: ["Böyüyə deyib platformaya şikayət edirəm", "Susuram", "Özüm də saxta düzəldirəm", "Paylaşıram"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t6", type: "fill_blank", prompt: "Aİ ilə düzəldilən real görünən saxta videoya ______ deyilir.", accepted: ["deepfake", "dipfeyk", "Deepfake"], xp: 10 },
            { id: "ai5-inan-l2-t7", type: "multiple_choice", prompt: "Saxta səs (səs klonlama) ilə hansı fırıldaq olur?", options: ["Qohumun səsi ilə pul istəmək", "Musiqi yazmaq", "Radio dinləmək", "Zəngi bağlamaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t8", type: "multiple_choice", prompt: "Tanışının səsi ilə telefonda təcili pul istənilir. Nə edirsən?", options: ["Zəngi bağlayıb özünə birbaşa zəng edirəm", "Dərhal pul göndərirəm", "Kart məlumatını deyirəm", "Heç kimə demirəm"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t9", type: "multiple_choice", prompt: "Sosial şəbəkədə şok başlıqlı video gördün. İlk fikrin nə olmalıdır?", options: ["Bu, diqqət üçün ola bilər — yoxlayım", "Dərhal inanmaq", "Dostlara göndərmək", "Şərh yazmaq"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l2-t10", type: "multiple_choice", prompt: "Başqasının şəklindən zarafat üçün saxta video düzəltmək olarmı?", options: ["Xeyr — bu, insanı incidir və qanunsuz ola bilər", "Bəli, zarafatdır", "Yalnız dostlar arasında olar", "Yalnız məktəbdə olar"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-inan-l2-b1", type: "multiple_choice", prompt: "'Əks şəkil axtarışı' nə üçündür?", options: ["Şəklin əvvəl harada dərc olunduğunu tapmaq", "Şəkli rəngləmək", "Şəkli kiçiltmək", "Şəkli silmək"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l2-b2", type: "multiple_choice", prompt: "Niyə saxta məzmun sürətlə yayılır?", options: ["Güclü hiss oyadır, insanlar yoxlamadan paylaşır", "Fayl kiçik olduğu üçün", "İnternet sürətli olduğu üçün", "Rəngli olduğu üçün"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l2-b3", type: "multiple_choice", prompt: "Aİ ilə yaradılan məzmunu qeyd etmək (etiketləmək) niyə yaxşıdır?", options: ["İnsanlar nəyin real olduğunu bilir", "Fayl kiçilir", "Sürət artır", "Rəng dəyişir"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l2-b4", type: "multiple_choice", prompt: "Deepfake video 'çox real' görünürsə nə edirsən?", options: ["Yenə də ikinci mənbədən yoxlayıram", "İnanıram", "Paylaşıram", "Yükləyirəm"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-inan-l3",
          title: "Məlumatını qoru",
          intro: "Aİ tətbiqinə nə yazdığın da bir məlumatdır.",
          sections: [
            { heading: "Nə yazmamalı?", body: "Ad-soyad, ünvan, məktəb, telefon, parol, kart nömrəsi, ailə sirri — Aİ söhbətinə yazılmamalıdır. Yazdıqların saxlanıla və başqa məqsədlə istifadə oluna bilər." },
            { heading: "Başqasının məlumatı", body: "Dostunun şəklini və ya yazışmanızı icazəsiz Aİ-yə vermək də düzgün deyil — o məlumat sənin deyil." },
          ],
          tasks: [
            { id: "ai5-inan-l3-t1", type: "multiple_choice", prompt: "Aİ söhbətinə hansını YAZMAMALISAN?", options: ["Parol və kart nömrəsi", "Dərsin mövzusu", "Sualın uzunluğu", "Fənn adı"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t2", type: "multiple_choice", prompt: "Yazdıqların nə ola bilər?", options: ["Saxlanıla və analiz edilə bilər", "Dərhal silinir həmişə", "Heç yerə getmir", "Yalnız sənin telefonunda qalır"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t3", type: "multiple_choice", prompt: "Dostunun şəxsi yazışmasını Aİ-yə göstərmək olarmı?", options: ["Xeyr, icazəsi olmadan olmaz", "Bəli, problem yoxdur", "Yalnız gecə", "Yalnız zarafat üçün"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t4", type: "multiple_choice", prompt: "Aİ tətbiqi yaş həddi qoyursa, bu nə üçündür?", options: ["Uşaqları uyğunsuz məzmundan qorumaq üçün", "Reklam üçün", "Sürət üçün", "Yer qənaəti üçün"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t5", type: "multiple_choice", prompt: "Aİ ilə söhbətdə narahat edən məzmun gördün. Nə edirsən?", options: ["Söhbəti dayandırıb böyüyə deyirəm", "Davam edirəm", "Dostuma göndərirəm", "Şəkil çəkib paylaşıram"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t6", type: "fill_blank", prompt: "Aİ-yə ______ (parol) yazmaq olmaz.", accepted: ["parol", "parolu", "Parol"], xp: 10 },
            { id: "ai5-inan-l3-t7", type: "multiple_choice", prompt: "Aİ-dən istifadə edərkən valideynin bilməsi niyə vacibdir?", options: ["Problem olsa kömək edə bilər", "Reklam azalır", "Sürət artır", "Batareya qənaət olunur"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t8", type: "multiple_choice", prompt: "Şəxsi şəkillərini Aİ tətbiqinə yükləmək təhlükəsizdirmi?", options: ["Ehtiyatlı olmaq lazımdır — şəkil saxlanıla bilər", "Tam təhlükəsizdir", "Yalnız gecə təhlükəlidir", "Fərqi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t9", type: "multiple_choice", prompt: "Aİ sənə şəxsi sual verirsə (ünvan, məktəb), nə edirsən?", options: ["Cavab vermirəm", "Dəqiq cavab verirəm", "Şəkil göndərirəm", "Telefon nömrəsi yazıram"], correctIndex: 0, xp: 10 },
            { id: "ai5-inan-l3-t10", type: "multiple_choice", prompt: "Ən doğru qayda hansıdır?", options: ["İnternetdə yazdığın hər şey qala bilər", "Yazılanlar həmişə silinir", "Yalnız şəkillər qalır", "Heç nə saxlanmır"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ai5-inan-l3-b1", type: "multiple_choice", prompt: "Niyə bəzi məktəblərdə Aİ istifadəsinə qayda qoyulur?", options: ["Öyrənmə və dürüstlük qorunsun deyə", "İnternet qənaəti üçün", "Elektrik üçün", "Səs-küy üçün"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l3-b2", type: "multiple_choice", prompt: "'Rəqəmsal iz' nə deməkdir?", options: ["İnternetdə buraxdığın izlərin toplusu", "Ekrandakı barmaq izi", "Klaviaturanın izi", "Şəkildəki kölgə"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l3-b3", type: "multiple_choice", prompt: "Aİ tətbiqinin məxfilik ayarlarını yoxlamaq nə verir?", options: ["Söhbətlərin saxlanmasını idarə edə bilirsən", "Sürət artır", "Rəng dəyişir", "Reklam çoxalır"], correctIndex: 0, xp: 15 },
            { id: "ai5-inan-l3-b4", type: "multiple_choice", prompt: "Ən yaxşı ümumi qayda hansıdır?", options: ["Tanımadığın adama deməyəcəyin şeyi Aİ-yə də yazma", "Hər şeyi yaz", "Heç nə yazma", "Yalnız gecə yaz"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ai5-inan-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Fənni bitirirsən! Sandığı aç.",
          tasks: [],
        },
        {
          id: "ai5-inan-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Tənqidi düşüncə bölməsinin yekun testi.",
          tasks: [],
        },
      ],
    },
  ],
};
