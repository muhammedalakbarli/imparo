// Rəqəmsal Təhlükəsizlik — 5-ci sinif proqramı (pilot).
// Bölmələr: 1) Şəxsi məlumatını qoru  2) Güclü parollar və hesab təhlükəsizliyi
// 3) Kiberbulli və fişinqi tanı.
// id prefiksi ds5-*.

import type { Subject } from "../types";

export const tehlukesizlik5: Subject = {
  slug: "reqemsal-tehlukesizlik-5",
  name: "Rəqəmsal Təhlükəsizlik",
  grade: 5,
  icon: "T",
  color: "emerald",
  units: [
    // ═══════════════ 1. Şəxsi məlumatını qoru ═══════════════
    {
      id: "ds5-sexsi-melumat",
      title: "Şəxsi məlumatını qoru",
      description: "Şəxsi məlumat nədir və internetdə kimlərlə nə paylaşmaq olar.",
      lessons: [
        {
          id: "ds5-sexsi-melumat-l1",
          title: "Şəxsi məlumat nədir?",
          intro: "İnternetdə səni tanıdan məlumatlar var — onları qorumaq lazımdır.",
          sections: [
            { heading: "Şəxsi məlumat", body: "Adın, soyadın, ev ünvanın, telefon nömrən, məktəbinin adı, doğum tarixin və şəkillərin — bunların hamısı ŞƏXSİ məlumatdır. Onları tanımadığın adamlarla paylaşma." },
            { heading: "Niyə vacibdir?", body: "Pis niyyətli adamlar bu məlumatlardan səni tapmaq və ya aldatmaq üçün istifadə edə bilər. Ona görə İNTERNETDƏ tanımadığın insanlara şəxsi məlumat vermə." },
          ],
          tasks: [
            { id: "ds5-sexsi-melumat-l1-t1", type: "multiple_choice", prompt: "Aşağıdakılardan hansı şəxsi məlumatdır?", options: ["Ev ünvanın", "Sevdiyin rəng", "Sevdiyin idman", "Sevdiyin fəsil"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t2", type: "multiple_choice", prompt: "Aşağıdakılardan hansı şəxsi məlumatdır?", options: ["Telefon nömrən", "Sevdiyin film", "Sevdiyin oyun", "Sevdiyin heyvan"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t3", type: "multiple_choice", prompt: "Tanımadığın biri internetdə səndən ev ünvanını istəyir. Nə etməlisən?", options: ["Vermə, valideynə de", "Dərhal ver", "Yalan ünvan ver", "Sual ver ona"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t4", type: "multiple_choice", prompt: "Hansı şəxsi məlumat SAYILMIR?", options: ["Sevdiyin rəng", "Doğum tarixin", "Məktəbinin adı", "Ev ünvanın"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t5", type: "multiple_choice", prompt: "Niyə şəxsi məlumatını qorumalısan?", options: ["Pis adamlar səni tapa/aldada bilər", "Çünki maraqsızdır", "Çünki uzundur", "Heç bir səbəb yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t6", type: "multiple_choice", prompt: "Onlayn oyunda tanımadığın oyunçu məktəbinin adını soruşur. Nə edirsən?", options: ["Demirəm", "Deyirəm, o dostumdur", "Deyirəm, maraqlı deyil", "Tam ünvanı da verirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t7", type: "multiple_choice", prompt: "Hansı daha TƏHLÜKƏSİZDİR paylaşmaq üçün?", options: ["Sevdiyin kitab", "Ev telefonun", "Məktəbdən çıxış vaxtın", "Yaşadığın küçə"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t8", type: "fill_blank", prompt: "İnternetdə tanımadığın adama ______ ünvanını demə. (bir söz)", accepted: ["ev", "Ev"], xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t9", type: "multiple_choice", prompt: "Şəkillərdə arxa planda görünə bilən şəxsi məlumat hansıdır?", options: ["Məktəbin lövhəsi/ünvanı", "Göy üzü", "Ağac", "Bulud"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t10", type: "multiple_choice", prompt: "Kim sənin şəxsi məlumatını bilə bilər?", options: ["Valideynlərin", "İnternetdəki hər kəs", "Tanımadığın oyunçular", "Naməlum e-poçt göndərənlər"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t11", type: "multiple_choice", prompt: "Bir sayt sənin doğum tarixini və tam adını tələb edir, valideynin xəbəri yoxdur. Nə edirsən?", options: ["Əvvəl valideynə deyirəm", "Dərhal doldururam", "Yalan yazıram və davam edirəm", "Dostuma da göndərirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l1-t12", type: "multiple_choice", prompt: "Hansı 'şəxsi məlumat' DEYİL?", options: ["Sevimli rəngin", "Tam ev ünvanın", "Telefon nömrən", "Doğum tarixin"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-sexsi-melumat-l1-b1", type: "multiple_choice", prompt: "Onlayn anketdə 'ünvanın?' sualı var, mükafat vəd edir. Nə edirsən?", options: ["Doldurmuram, şübhəlidir", "Dərhal doldururam", "Yalan ünvan yazıram", "Dostumun ünvanını yazıram"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l1-b2", type: "multiple_choice", prompt: "Şəxsi məlumatını qorumaq nəyə bənzəyir?", options: ["Evinin açarını yad adama verməmək", "Oyuncaqları paylaşmaq", "Kitab oxumaq", "İdman etmək"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l1-b3", type: "multiple_choice", prompt: "Profilində istifadəçi adı seçirsən. Ən TƏHLÜKƏSİZ hansıdır?", options: ["SuperKoala_99", "Aysel_Memmedova_2015", "BakiSeh6NoMekteb", "AyselEvUnvan"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l1-b4", type: "multiple_choice", prompt: "Real dostun onlayn oyunda görünüb, amma normalda fərqli danışır və qəribə suallar verir. Nə düşünürsən?", options: ["Bəlkə hesabı oğurlanıb, valideynə deyirəm", "Adi haldır, davam edirəm", "Şəxsi məlumat verirəm", "Heç nə etmirəm"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l1-b5", type: "multiple_choice", prompt: "'Şəxsi məlumat' anlayışına ən yaxşı tərif hansıdır?", options: ["Səni digərlərindən fərqləndirən, səni tapmağa imkan verən məlumat", "Hər kəsin bildiyi məlumat", "Kitabda yazılan məlumat", "Oyunda qazanılan xal"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ds5-sexsi-melumat-l2",
          title: "Kimlərlə nə paylaşmaq olar?",
          intro: "Dostlar, ailə və tanımadıqlar — hər kəslə eyni şeyi paylaşmaq olmaz.",
          sections: [
            { heading: "Dairələr", body: "Ailə və yaxın dostlarınla daha çox paylaşa bilərsən, amma internetdə tanış olduğun adamlarla — YOX. Onlayn tanışlıq real tanışlıq demək deyil." },
            { heading: "Şəkil və video", body: "Şəkil/video paylaşmadan əvvəl düşün: bu şəkildə ev, məktəb, ünvan görünürmü? Paylaşmadan əvvəl valideynindən soruş." },
          ],
          tasks: [
            { id: "ds5-sexsi-melumat-l2-t1", type: "multiple_choice", prompt: "Onlayn oyunda tanış olduğun 'dost' səni görüşməyə çağırır. Nə edirsən?", options: ["Getmirəm, valideynə deyirəm", "Tək gedirəm", "Ünvanımı verirəm", "Vaxt təyin edirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t2", type: "multiple_choice", prompt: "Şəkil paylaşmadan əvvəl nəyə diqqət etməlisən?", options: ["Arxa planda ünvan/məktəb görünürmü", "Şəklin ölçüsünə", "Rənginə", "Vaxtına"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t3", type: "multiple_choice", prompt: "Kiminlə ev ünvanını paylaşmaq TƏHLÜKƏSİZDİR?", options: ["Valideynlərinlə", "İnternetdə tanış olduğun hər kəslə", "Naməlum oyunçu ilə", "Reklamda gördüyün sayt ilə"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t4", type: "multiple_choice", prompt: "Onlayn tanışlıq real tanışlıqdan nə ilə fərqlənir?", options: ["Kimliyini yəqin bilmirsən", "Heç nə ilə", "Daha etibarlıdır", "Daha sürətlidir"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t5", type: "multiple_choice", prompt: "Video zəngdə tanımadığın biri kamerasını açmağını istəyir. Nə edirsən?", options: ["Rədd edirəm, valideynə deyirəm", "Açıram", "Sükut edirəm", "Zəngi davam etdirirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t6", type: "fill_blank", prompt: "Onlayn tanış olduğun adamla ______ görüşməməlisən (tək bir söz).", accepted: ["tək", "Tək"], xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t7", type: "multiple_choice", prompt: "Bir 'dost' səndən şəxsi şəkil istəyir. Nə etməlisən?", options: ["Rədd edirəm, böyüyə deyirəm", "Göndərirəm", "Sual verirəm niyə", "Fikirləşirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t8", type: "multiple_choice", prompt: "Şəkillərini kim görə bilər — bunu haradan idarə edə bilərsən?", options: ["Profil məxfilik ayarlarından", "Heç yerdən", "Yalnız valideyn edə bilər", "Dəyişmək olmaz"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t9", type: "multiple_choice", prompt: "İnternetdə narahat/qorxulu hiss etdirən bir mesaj alsan, ilk addım nədir?", options: ["Etibar etdiyin bir böyüyə de", "Cavab yazma, sakit qal", "Sil, unut", "Dostlarına göndər"], correctIndex: 0, xp: 10 },
            { id: "ds5-sexsi-melumat-l2-t10", type: "multiple_choice", prompt: "Aşağıdakılardan hansı ƏN TƏHLÜKƏSİZ paylaşımdır?", options: ["Sevdiyin kitabın adı", "Ev ünvanın", "Məktəbə gedəcəyin vaxt", "Tək evdə olduğun vaxt"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-sexsi-melumat-l2-b1", type: "multiple_choice", prompt: "Onlayn dostun səndən valideynindən gizli sirr saxlamağını istəyir. Bu nə deməkdir?", options: ["Təhlükə əlaməti — böyüyə deyilməli", "Normal dostluqdur", "Əhəmiyyəti yoxdur", "Sirr saxlamaq yaxşıdır"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l2-b2", type: "multiple_choice", prompt: "Sinif yoldaşının şəklini onun icazəsi olmadan paylaşmaq düzgündürmü?", options: ["Xeyr, əvvəlcə icazə lazımdır", "Bəli, hər zaman olar", "Yalnız gecə olar", "Fərq etməz"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l2-b3", type: "multiple_choice", prompt: "'Məxfilik ayarları' nə üçündür?", options: ["Kimin nəyi görə biləcəyini idarə etmək", "Şəkli daha gözəl etmək", "Sürəti artırmaq", "Oyunu asanlaşdırmaq"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l2-b4", type: "multiple_choice", prompt: "İnternetdə 'etibar dairəsi' ən yaxşı necə təsvir olunur?", options: ["Valideyn/yaxın ailə — böyük dairə deyil", "Hamı eyni dairədədir", "Yalnız onlayn dostlar", "Heç kim etibar dairəsində deyil"], correctIndex: 0, xp: 15 },
            { id: "ds5-sexsi-melumat-l2-b5", type: "multiple_choice", prompt: "Tanımadığın biri sənə pul/hədiyyə vəd edib şəxsi məlumat istəyir. Bu nədir?", options: ["Şübhəli fırıldaq əlaməti", "Normal hədiyyə", "Etibarlı təklif", "Mükafat proqramı"], correctIndex: 0, xp: 15 },
          ],
        },
      ],
    },
    // ═══════════════ 2. Güclü parollar və hesab təhlükəsizliyi ═══════════════
    {
      id: "ds5-parollar",
      title: "Güclü parollar və hesab təhlükəsizliyi",
      description: "Yaxşı parol necə qurulur və hesabını necə qoruyursan.",
      lessons: [
        {
          id: "ds5-parollar-l1",
          title: "Yaxşı parol necə qurulur?",
          intro: "Güclü parol hesabını qapı kimi qoruyur.",
          sections: [
            { heading: "Güclü parol", body: "Ən az 8 simvol, böyük+kiçik hərf, rəqəm və işarə qarışığı olmalıdır. Adın, doğum tarixin kimi asan tapılan şeyləri istifadə etmə." },
            { heading: "Hər hesab üçün ayrı", body: "Eyni parolu hər yerdə işlətmə — biri oğurlansa, hamısı təhlükəyə düşər." },
          ],
          tasks: [
            { id: "ds5-parollar-l1-t1", type: "multiple_choice", prompt: "Hansı ən GÜCLÜ paroldur?", options: ["Kx7!mQp2z", "123456", "parol", "adiniz2015"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t2", type: "multiple_choice", prompt: "Güclü parolda nə olmalıdır?", options: ["Böyük/kiçik hərf, rəqəm, işarə", "Yalnız adın", "Yalnız rəqəmlər", "Yalnız kiçik hərflər"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t3", type: "numeric", prompt: "Güclü parol ən azı neçə simvol olmalıdır?", answer: 8, xp: 10 },
            { id: "ds5-parollar-l1-t4", type: "multiple_choice", prompt: "Parolunda nəyi İSTİFADƏ ETMƏMƏLİSƏN?", options: ["Doğum tarixini", "Rəqəmləri", "İşarələri", "Böyük hərfləri"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t5", type: "multiple_choice", prompt: "Bütün hesablarında eyni parolu işlətmək nə üçün pisdir?", options: ["Biri oğurlansa hamısı risk altındadır", "Yadda saxlamaq çətindir", "Yavaş işləyir", "Baha başa gəlir"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t6", type: "multiple_choice", prompt: "Aşağıdakılardan hansı ZƏİF paroldur?", options: ["123456", "Kx7!mQp2z", "T#9wLq3!v", "aB4$kR8@n"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t7", type: "fill_blank", prompt: "Güclü parolda böyük hərf, kiçik hərf, rəqəm və ______ olmalıdır.", accepted: ["işarə", "işarələr", "Işarə"], xp: 10 },
            { id: "ds5-parollar-l1-t8", type: "multiple_choice", prompt: "Parolunu kimlə paylaşmaq olar?", options: ["Heç kimlə (valideyndən başqa)", "Ən yaxın dostunla", "Sinif yoldaşınla", "Hamı ilə"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t9", type: "multiple_choice", prompt: "Niyə adın/soyadın parolda pisdir?", options: ["Hamı bilir/tapmaq asandır", "Çox qısadır", "Yazmaq çətindir", "Rəngi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l1-t10", type: "multiple_choice", prompt: "'Sevimlim2015' parolu niyə zəifdir?", options: ["Şəxsi məlumata (il) əsaslanır, asan tapılır", "Çox uzundur", "İşarə var", "Rəqəm var"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-parollar-l1-b1", type: "multiple_choice", prompt: "Parol meneceri (password manager) nə üçündür?", options: ["Güclü parolları yadda saxlamaq", "Oyun oynamaq", "Şəkil çəkmək", "Video izləmək"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l1-b2", type: "multiple_choice", prompt: "'Uzun cümlə' üsulu (məs. 'MənQırmızıPişik7Sevirəm!') nə üçün güclüdür?", options: ["Uzun və yadda qalandır, tapmaq çətindir", "Qısadır", "Rəqəmsizdir", "Hamı işlədir"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l1-b3", type: "multiple_choice", prompt: "Parolunu neçə vaxtdan bir dəyişmək məsləhətdir (əgər sızma şübhəsi varsa)?", options: ["Dərhal", "Heç vaxt", "10 ildən bir", "Yalnız unutsan"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l1-b4", type: "multiple_choice", prompt: "'aaaaaaaa' niyə zəif paroldur, uzun olsa belə?", options: ["Təkrarlanan, asan təxmin olunur", "Çox qısadır", "Rəqəm yoxdur ona görə yaxşıdır", "İdeal paroldur"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l1-b5", type: "multiple_choice", prompt: "Parolunu brauzerdə 'yadda saxla' etmək həmişə təhlükəsizdirmi?", options: ["Paylaşılan kompüterdə YOX", "Həmişə tam təhlükəsizdir", "Fərq etməz", "Yalnız gecə təhlükəlidir"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ds5-parollar-l2",
          title: "Hesabını necə qoruyursan?",
          intro: "Parol kifayət deyil — hesabını qorumaq üçün başqa addımlar da var.",
          sections: [
            { heading: "İki addımlı təsdiq", body: "Bəzi hesablar parolla yanaşı telefonuna kod göndərir (2FA). Bu, hesabını daha da təhlükəsiz edir — parolu bilsə belə, kimsə kodsuz girə bilməz." },
            { heading: "Şübhəli mesajlar", body: "'Hesabın bloklanacaq, linkə klikləyib parolunu yaz' kimi mesajlar adətən fırıldaqdır (fişinq). Rəsmi saytlar heç vaxt e-poçtla parol İSTƏMİR." },
          ],
          tasks: [
            { id: "ds5-parollar-l2-t1", type: "multiple_choice", prompt: "İki addımlı təsdiq (2FA) nəyə kömək edir?", options: ["Parol bilinsə belə əlavə qoruma verir", "Parolu yadda saxlayır", "Oyunu sürətləndirir", "Şəkli yaxşılaşdırır"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t2", type: "multiple_choice", prompt: "E-poçtda 'Hesabın bloklanacaq, parolunu buraya yaz' yazılıb. Bu nədir?", options: ["Fişinq (fırıldaq) cəhdi", "Rəsmi xəbərdarlıq", "Adi bildiriş", "Reklam"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t3", type: "multiple_choice", prompt: "Rəsmi sayt/şirkət səndən nəyi HEÇ VAXT istəməz?", options: ["Parolunu e-poçtla göndərməyini", "Adını", "Sualını", "Rəyini"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t4", type: "multiple_choice", prompt: "Hesabına naməlum yerdən giriş barədə bildiriş aldın. Nə edirsən?", options: ["Parolu dəyişirəm, böyüyə deyirəm", "Görməzdən gəlirəm", "Hesabı silirəm", "Heç nə etmirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t5", type: "multiple_choice", prompt: "Naməlum linkə klikləmək niyə təhlükəli ola bilər?", options: ["Zərərli sayta/virusa apara bilər", "Həmişə əyləncəlidir", "Sürəti artırır", "Heç bir təhlükə yoxdur"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t6", type: "multiple_choice", prompt: "'Siz 1.000.000 manat udmusunuz, linkə klikləyin!' — bu nədir?", options: ["Fırıldaq (çox yaxşı görünən şey adətən yalandır)", "Real mükafat", "Bank bildirişi", "Məktəb xəbəri"], correctIndex: 0, xp: 10 },
            { id: "ds5-parollar-l2-t7", type: "fill_blank", prompt: "Parolla yanaşı telefona kod göndərən qoruma üsuluna ikiaddımlı ______ deyilir.", accepted: ["təsdiq", "Təsdiq"], xp: 10 },
            { id: "ds5-parollar-l2-t8", type: "multiple_choice", prompt: "Kimsə sənə 'parolunu de, sənə kömək edim' deyir. Nə etməlisən?", options: ["Verməmək, bu fırıldaq ola bilər", "Dərhal vermək", "Yarısını demək", "Sonra demək"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-parollar-l2-b1", type: "multiple_choice", prompt: "Fişinq e-poçtunu necə tanıya bilərsən?", options: ["Təcili ton, şübhəli link, orfoqrafiya səhvləri", "Gözəl dizaynı ilə", "Uzunluğu ilə", "Rəngi ilə"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l2-b2", type: "multiple_choice", prompt: "Hesabın oğurlanıbsa, İLK addım nə olmalıdır?", options: ["Parolu dərhal dəyişmək, böyüyə demək", "Gözləmək", "Yeni hesab açmaq və köhnəni unutmaq", "Heç nə etməmək"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l2-b3", type: "multiple_choice", prompt: "'https://' önündə kilid işarəsi nəyi göstərir?", options: ["Bağlantı şifrələnib (daha təhlükəsizdir)", "Sayt pulludur", "Sayt yavaşdır", "Heç nəyi göstərmir"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l2-b4", type: "multiple_choice", prompt: "'instagraam.com' (əlavə 'a' ilə) ünvanı nəyə işarədir?", options: ["Saxta/oxşar sayt ola bilər — diqqətli ol", "Rəsmi Instagram-dır", "Yeni versiyadır", "Fərq etməz"], correctIndex: 0, xp: 15 },
            { id: "ds5-parollar-l2-b5", type: "multiple_choice", prompt: "Niyə ictimai wifi-də bank hesabına girmək riskli ola bilər?", options: ["Şəbəkə təhlükəsiz olmaya bilər, məlumat ələ keçə bilər", "Wifi yavaşdır", "Pulsuzdur", "Heç bir risk yoxdur"], correctIndex: 0, xp: 15 },
          ],
        },
      ],
    },
    // ═══════════════ 3. Kiberbulli və fişinqi tanı ═══════════════
    {
      id: "ds5-kiberbulli",
      title: "Kiberbulli və fişinqi tanı",
      description: "Onlayn zorakılığı tanı və düzgün reaksiya ver.",
      lessons: [
        {
          id: "ds5-kiberbulli-l1",
          title: "Kiberbulliyə qarşı nə etməli?",
          intro: "İnternetdə kimsə səni incidirsə, bunu susma — kömək istə.",
          sections: [
            { heading: "Kiberbulli nədir?", body: "İnternetdə kiməsə pis sözlər yazmaq, təhqir etmək, utandırıcı şəkil paylaşmaq və ya təkrar-təkrar narahat etmək — bunların hamısı kiberbullidir." },
            { heading: "Nə etməli?", body: "Cavab yazma, sübutu (skrinşot) saxla, bloklayıb şikayət et, mütləq etibar etdiyin bir böyüyə de. Bu sənin günahın deyil." },
          ],
          tasks: [
            { id: "ds5-kiberbulli-l1-t1", type: "multiple_choice", prompt: "Kimsə sənə internetdə davamlı pis sözlər yazır. Bu nədir?", options: ["Kiberbulli", "Zarafat", "Oyun", "Adi söhbət"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t2", type: "multiple_choice", prompt: "Kiberbulliyə məruz qalanda ilk addım nədir?", options: ["Etibar etdiyin böyüyə demək", "Cavabında təhqir etmək", "Susub gizlətmək", "Hesabı silmək"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t3", type: "multiple_choice", prompt: "Kiberbulli mesajlarına necə cavab verməlisən?", options: ["Cavab yazma, sübutu saxla", "Eyni sözlə cavab ver", "Daha pis yaz", "Hamıya göstər, izlə"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t4", type: "multiple_choice", prompt: "Kiberbulliyin sübutunu necə saxlaya bilərsən?", options: ["Skrinşot çəkməklə", "Yaddan çıxarmaqla", "Silməklə", "Danışmaqla"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t5", type: "multiple_choice", prompt: "Sinif yoldaşının başqasına kiberbulli etdiyini görürsən. Nə etməlisən?", options: ["Böyüyə de, susma", "Görməzdən gəl", "Sən də qoşul", "Video çək, paylaş"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t6", type: "multiple_choice", prompt: "Kiberbulliyə məruz qalmaq kimin günahıdır?", options: ["Heç kimin — bunu edənin günahıdır", "Qurbanın", "Valideynin", "Müəllimin"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t7", type: "multiple_choice", prompt: "Şəxsi mesajlarda kimsə səni utandırıcı şəkil paylaşmaqla hədələyir. Nə edirsən?", options: ["Böyüyə de, ekranı saxla, cavab vermə", "İstədiyini edirəm ki, sakit olsun", "Sirr saxlayıram", "Özüm hədə ilə cavab verirəm"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t8", type: "fill_blank", prompt: "Kiberbulli olanda mesajları cavabsız qoy, sübutu saxla və bir böyüyə ______.", accepted: ["de", "danış", "söylə"], xp: 10 },
            { id: "ds5-kiberbulli-l1-t9", type: "multiple_choice", prompt: "'Blok et' düyməsi nə üçündür?", options: ["Həmin şəxsin sənə mesaj/yazı göndərməsini dayandırır", "Hesabını silir", "Şəkilləri yaxşılaşdırır", "İnterneti sürətləndirir"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l1-t10", type: "multiple_choice", prompt: "Kiberbulliyi görəndə susmaq düzgündürmü?", options: ["Xeyr, kömək istəmək lazımdır", "Bəli, həmişə susmaq lazımdır", "Fərq etməz", "Yalnız gecə susmaq olar"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-kiberbulli-l1-b1", type: "multiple_choice", prompt: "Anonim hesabdan gələn təhqiredici mesaj — kimliyi bilmirsən deyə nə fərqi var?", options: ["Yenə də böyüyə deyilməli və şikayət olunmalıdır", "Heç nə etmək lazım deyil, anonimdir", "Cavab vermək lazımdır", "Əhəmiyyəti yoxdur"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l1-b2", type: "multiple_choice", prompt: "Kiberbulliyi 'adi zarafatdan' fərqləndirən əsas cəhət nədir?", options: ["Təkrarlanması və qarşı tərəfi incitmə niyyəti", "Sözlərin uzunluğu", "Vaxtı (gecə/gündüz)", "Platforması"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l1-b3", type: "multiple_choice", prompt: "Dost qrupunda kimsə haqqında pis zarafat mesajları dövr edir, sən də paylaşırsan. Bu nədir?", options: ["Kiberbulliyə şərik olmaq", "Zərərsiz zarafat", "Dostluq nişanəsi", "Əhəmiyyətsiz"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l1-b4", type: "multiple_choice", prompt: "Platformada 'şikayət et (report)' funksiyası nəyə xidmət edir?", options: ["Qayda pozan məzmun/istifadəçini administrasiyaya bildirmək", "Hesabı yeniləmək", "Dostları görmək", "Oyunu bitirmək"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l1-b5", type: "multiple_choice", prompt: "Kiberbulliyə məruz qalan dostuna ən yaxşı dəstək nədir?", options: ["Ona inanmaq, kömək üçün bir böyüyə deməyə dəstək olmaq", "Görməzdən gəlmək", "Ona gülmək", "Başqasına danışmaq"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "ds5-kiberbulli-l2",
          title: "Fişinq və fırıldaqları tanı",
          intro: "'Çox yaxşı görünən' təkliflər çox vaxt fırıldaqdır.",
          sections: [
            { heading: "Fişinq əlamətləri", body: "Təcili ton ('DƏRHAL et!'), tanımadığın göndərən, orfoqrafiya səhvləri, şübhəli link, 'mükafat qazandın' — bunlar fişinq əlamətləridir." },
            { heading: "Qızıl qayda", body: "Şübhələnəndə klikləmə. Əvvəlcə böyüyündən soruş. Real mükafatlar səndən şəxsi məlumat/parol İSTƏMİR." },
          ],
          tasks: [
            { id: "ds5-kiberbulli-l2-t1", type: "multiple_choice", prompt: "'TƏBRİKLƏR! Siz telefon udmusunuz, linkə klikləyin!' — bu mesaj adətən nədir?", options: ["Fişinq/fırıldaq", "Real hədiyyə", "Məktəb bildirişi", "Oyun mükafatı"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t2", type: "multiple_choice", prompt: "Fişinq mesajlarının ümumi əlaməti hansıdır?", options: ["Təcili hərəkət tələb edir", "Sakit tondadır", "Uzun izahat verir", "Heç nə istəmir"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t3", type: "multiple_choice", prompt: "Naməlum göndərəndən gələn linkə klikləməzdən əvvəl nə etməlisən?", options: ["Şübhələn, böyüyündən soruş", "Dərhal klikləyirəm", "Dostlara göndərirəm", "Cavab yazıram"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t4", type: "multiple_choice", prompt: "Real bir mükafat/bank səndən nəyi İSTƏMƏZ?", options: ["Parolunu/kart nömrəni e-poçtla", "Adını", "Şəhərini", "Yaşını"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t5", type: "multiple_choice", prompt: "Orfoqrafiya səhvləri dolu, qəribə linkli mesaj — bu nəyə işarədir?", options: ["Fişinq ola biləcəyinə", "Rəsmi mesaja", "Yaxşı yazılmış məktuba", "Heç nəyə"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t6", type: "fill_blank", prompt: "Şübhəli linkə klikləməzdən əvvəl ______ soruş. (bir söz)", accepted: ["böyükdən", "böyüyündən", "valideyndən"], xp: 10 },
            { id: "ds5-kiberbulli-l2-t7", type: "multiple_choice", prompt: "'Hesabın 1 saata bağlanacaq, indi daxil ol!' mesajı nəyə işarədir?", options: ["Süni təcililik yaradan fişinq cəhdi", "Real xəbərdarlıq", "Adi bildiriş", "Sistem yeniləməsi"], correctIndex: 0, xp: 10 },
            { id: "ds5-kiberbulli-l2-t8", type: "multiple_choice", prompt: "Fişinq sözü haradan gəlir (fikir üçün)?", options: ["'Fishing' (balıq ovlamaq) — səni 'tovlamaq'", "Fizika sözündən", "Fin dilindən", "Heç bir mənası yoxdur"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "ds5-kiberbulli-l2-b1", type: "multiple_choice", prompt: "Dostunun hesabından qəribə bir link gəlir ('bunu yoxla!!'). Nə ola bilər?", options: ["Onun hesabı ələ keçirilib, ehtiyatlı ol", "Mütləq təhlükəsizdir, dostundandır", "Dərhal klikləyirəm", "Cavab yazıram, sirr paylaşıram"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l2-b2", type: "multiple_choice", prompt: "'Ödəniş məlumatını təsdiqləmək üçün buraya klikləyin' mesajı — real bank belə yazarmı?", options: ["Yox, real banklar bunu e-poçt/mesajla istəməz", "Bəli, hər zaman belə edir", "Yalnız gecə edir", "Fərq etməz"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l2-b3", type: "multiple_choice", prompt: "Fişinq və kiberbulli arasındakı əsas fərq nədir?", options: ["Fişinq aldadıb məlumat oğurlamaq, bulli isə incitməkdir", "Heç bir fərq yoxdur", "Fişinq daha zərərsizdir", "Bulli yalnız oyunlarda olur"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l2-b4", type: "multiple_choice", prompt: "Naməlum tətbiqi (app) yükləməzdən əvvəl nəyə baxmaq faydalıdır?", options: ["Rəylərə və hansı icazələr istədiyinə", "Yalnız ikonuna", "Yalnız adına", "Heç nəyə baxmaq lazım deyil"], correctIndex: 0, xp: 15 },
            { id: "ds5-kiberbulli-l2-b5", type: "multiple_choice", prompt: "Bu dərsdən ən vacib qaydanı seç:", options: ["Şübhələn, soruş, tələsmə", "Hər linkə klikləmək lazımdır", "Heç kimə güvənmə", "Parolunu hər kəslə paylaş"], correctIndex: 0, xp: 15 },
          ],
        },
      ],
    },
  ],
};
