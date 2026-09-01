// Kibertəhlükəsizlik — 5-ci sinif proqramı (pilot fənn).
// Bölmələr: 1) Zərərli proqramlar  2) Şəbəkə və cihaz təhlükəsizliyi
// 3) Sosial mühəndislik və hesabın bərpası.
// id prefiksi kt5-*.
//
// QƏSDƏN "Rəqəmsal Təhlükəsizlik" (ds5) fənnindən FƏRQLİ mövzular seçilib:
// ds5 şəxsi məlumat, kiberbulli, fişinq və parol qurmağı öyrədir. Bu fənn isə
// TEXNİKİ tərəfi tutur — zərərli proqram, şəbəkə, cihaz, icazələr, hesabın
// oğurlanmasından sonra atılacaq addımlar. İki fənn bir-birini tamamlayır,
// təkrarlamır.

import type { Subject } from "../types";

export const kibertehlukesizlik5: Subject = {
  slug: "kibertehlukesizlik-5",
  name: "Kibertəhlükəsizlik",
  grade: 5,
  icon: "K",
  color: "sky",
  units: [
    // ═══════════════ 1. Zərərli proqramlar ═══════════════
    {
      id: "kt5-zererli",
      title: "Zərərli proqramlar",
      description: "Virus, casus proqram və fidyə nədir, haradan yoluxur, necə qorunmalı.",
      lessons: [
        {
          id: "kt5-zererli-l1",
          title: "Zərərli proqram nədir?",
          intro: "Bəzi proqramlar kömək etmək üçün yox, zərər vermək üçün yazılır.",
          sections: [
            { heading: "Növləri", body: "VİRUS özünü yayır və faylları xarab edir. CASUS proqram sənin yazdıqlarını gizlicə izləyir. FİDYƏ proqramı faylları kilidləyib pul tələb edir. Hamısına birlikdə 'zərərli proqram' deyilir." },
            { heading: "Necə bilinir?", body: "Cihaz qəfil yavaşlayır, tanımadığın tətbiqlər peyda olur, reklam pəncərələri açılır, batareya tez bitir — bunlar şübhə əlamətidir. Şübhələnəndə cihazı böyüyə göstər." },
          ],
          tasks: [
            { id: "kt5-zererli-l1-t1", type: "multiple_choice", prompt: "Zərərli proqram nədir?", options: ["Cihaza zərər vermək üçün yazılmış proqram", "Yavaş internet", "Köhnə telefon", "Boş yaddaş"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t2", type: "multiple_choice", prompt: "Casus proqram nə edir?", options: ["Gizlicə məlumatını izləyir", "Ekranı təmizləyir", "Batareyanı doldurur", "Səsi artırır"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t3", type: "multiple_choice", prompt: "Fidyə proqramı (ransomware) nə edir?", options: ["Faylları kilidləyib pul tələb edir", "Şəkil çəkir", "Oyun yükləyir", "Musiqi səsləndirir"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t4", type: "multiple_choice", prompt: "Hansı yoluxma əlamətidir?", options: ["Tanımadığın tətbiqlərin peyda olması", "Ekranın rəngli olması", "Zəngin gəlməsi", "Şəkil çəkməyin"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t5", type: "multiple_choice", prompt: "Virusun əsas xüsusiyyəti nədir?", options: ["Özünü yaymaq", "Sürəti artırmaq", "Yaddaşı təmizləmək", "Şəkil çəkmək"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t6", type: "fill_blank", prompt: "Faylları kilidləyib pul istəyən zərərli proqrama ______ proqramı deyilir.", accepted: ["fidyə", "fidye", "ransomware"], xp: 10 },
            { id: "kt5-zererli-l1-t7", type: "multiple_choice", prompt: "Cihazın qəfil çox yavaşladı və reklam açılır. Nə edirsən?", options: ["Böyüyə deyib yoxlatdırıram", "Görməzdən gəlirəm", "Daha çox tətbiq yükləyirəm", "Reklama klikləyirəm"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t8", type: "multiple_choice", prompt: "Zərərli proqram nəyi oğurlaya bilər?", options: ["Parol və şəxsi məlumatı", "Yalnız oyun xallarını", "Yalnız zəng siyahısını", "Heç nəyi"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t9", type: "multiple_choice", prompt: "'Antivirus' nə üçündür?", options: ["Zərərli proqramı tapıb təmizləmək üçün", "İnterneti sürətləndirmək üçün", "Şəkil çəkmək üçün", "Oyun oynamaq üçün"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l1-t10", type: "multiple_choice", prompt: "Zərərli proqram yalnız kompüterə yoluxurmu?", options: ["Xeyr, telefon və planşetə də", "Bəli, yalnız kompüterə", "Yalnız televizora", "Yalnız oyun konsoluna"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-zererli-l1-b1", type: "multiple_choice", prompt: "'Troyan' adı haradan gəlir?", options: ["Faydalı görünüb içində zərər gizlədən proqramdır", "Sürətli olduğu üçün", "Yaşıl rəngli olduğu üçün", "Kiçik olduğu üçün"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l1-b2", type: "multiple_choice", prompt: "Fidyə tələb edənlərə pul ödəmək düzgündürmü?", options: ["Xeyr — faylların qaytarılacağına zəmanət yoxdur", "Bəli, dərhal ödəmək lazımdır", "Yalnız az məbləğ olsa", "Fərqi yoxdur"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l1-b3", type: "multiple_choice", prompt: "Klaviatura izləyicisi (keylogger) nəyi oğurlayır?", options: ["Yazdığın parolları", "Ekranın rəngini", "Batareyanı", "İnterneti"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l1-b4", type: "multiple_choice", prompt: "Cihazda zərərli proqram tapıldı. Ən doğru ilk addım?", options: ["İnterneti kəsib böyüyə/mütəxəssisə müraciət etmək", "Bütün şəkilləri paylaşmaq", "Parolları eyni saxlamaq", "Heç nə etməmək"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-zererli-l2",
          title: "Haradan yoluxur?",
          intro: "Zərərli proqram çox vaxt 'pulsuz' və 'sürətli' vədlərlə gəlir.",
          sections: [
            { heading: "Ən çox rast gəlinən yollar", body: "Rəsmi olmayan saytdan yüklənən oyun/hiylə proqramı ('cheat'), naməlum e-poçt qoşması, saxta 'yenilə' düyməsi, tanımadığın USB fləş kart və pulsuz film saytları." },
            { heading: "Qızıl qayda", body: "Tətbiqi YALNIZ rəsmi mağazadan yüklə (App Store, Google Play) və ya rəsmi saytdan. 'Pulsuz premium', 'sonsuz pul' vədləri demək olar həmişə tələdir." },
          ],
          tasks: [
            { id: "kt5-zererli-l2-t1", type: "multiple_choice", prompt: "Tətbiqi haradan yükləmək ən təhlükəsizdir?", options: ["Rəsmi mağazadan", "Reklamdakı linkdən", "Naməlum saytdan", "Mesajla gələn fayldan"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t2", type: "multiple_choice", prompt: "'Oyunda sonsuz pul verən proqram' təklifi nədir?", options: ["Çox güman tələ/zərərli proqram", "Rəsmi yenilik", "Faydalı alət", "Oyunun hissəsi"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t3", type: "multiple_choice", prompt: "Naməlum e-poçtdakı qoşma faylı açmaq olarmı?", options: ["Xeyr", "Bəli, maraqlıdırsa", "Yalnız şəkil olsa", "Yalnız kiçik olsa"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t4", type: "multiple_choice", prompt: "Yerdə tapdığın USB fləşi kompüterə taxmaq olarmı?", options: ["Xeyr, zərərli proqram ola bilər", "Bəli, maraqlıdır", "Yalnız məktəbdə", "Yalnız evdə"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t5", type: "multiple_choice", prompt: "Saytda 'Cihazınız yoluxub, indi təmizləyin!' yazısı çıxdı. Nə edirsən?", options: ["Klikləmirəm, səhifəni bağlayıram", "Dərhal klikləyirəm", "Nömrəyə zəng edirəm", "Kart məlumatı yazıram"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t6", type: "fill_blank", prompt: "Tətbiqləri yalnız ______ mağazadan yüklə (bir söz).", accepted: ["rəsmi", "resmi", "Rəsmi"], xp: 10 },
            { id: "kt5-zererli-l2-t7", type: "multiple_choice", prompt: "Pulsuz film saytları niyə risklidir?", options: ["Reklam və saxta 'oynat' düymələri zərərli fayl yükləyir", "Filmlər uzun olur", "İnternet yavaşlayır", "Səs keyfiyyəti pisdir"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t8", type: "multiple_choice", prompt: "Dostun sənə naməlum '.exe' faylı göndərdi. Nə edirsən?", options: ["Açmıram, əvvəlcə özündən soruşuram", "Dərhal açıram", "Başqalarına göndərirəm", "Adını dəyişib açıram"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t9", type: "multiple_choice", prompt: "Tətbiq yükləməzdən əvvəl nəyə baxmaq faydalıdır?", options: ["Rəylərə, yükləmə sayına və naşirin adına", "İkonun rənginə", "Faylın ölçüsünə yalnız", "Adın uzunluğuna"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l2-t10", type: "multiple_choice", prompt: "Ən çox yayılan yoluxma yolu hansıdır?", options: ["İstifadəçinin özünün naməlum fayl açması", "Cihazın köhnəlməsi", "İnternetin sürətli olması", "Ekranın böyüklüyü"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-zererli-l2-b1", type: "multiple_choice", prompt: "Niyə 'hiylə proqramları' (cheat) xüsusilə risklidir?", options: ["Rəsmi mağazada olmur, hesabı da bloklanır", "Çox yer tutur", "Sürətli işləyir", "Rəngi qaranlıqdır"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l2-b2", type: "multiple_choice", prompt: "Saxta tətbiq necə tanınır?", options: ["Ad/loqo oxşayır, naşir adı və rəylər fərqlidir", "Həmişə pullu olur", "İkonu olmur", "Adı çox qısa olur"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l2-b3", type: "multiple_choice", prompt: "Yeniləmə bildirişi hansı halda etibarlıdır?", options: ["Cihazın öz ayarlarından/mağazadan gələndə", "Saytda pəncərə kimi çıxanda", "Reklamda görünəndə", "Mesajla gələndə"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l2-b4", type: "multiple_choice", prompt: "'Pulsuz premium hesab' vədi çox vaxt nə deməkdir?", options: ["Məlumatını oğurlamaq üçün tələ", "Yeni kampaniya", "Rəsmi hədiyyə", "Oyun mükafatı"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-zererli-l3",
          title: "Qorunma addımları",
          intro: "Yeniləmə, ehtiyat nüsxə və sağlam şübhə — üç əsas qalxan.",
          sections: [
            { heading: "Yeniləmə", body: "Proqram yeniləmələri təkcə yeni funksiya gətirmir — tapılmış TƏHLÜKƏSİZLİK deşiklərini bağlayır. Köhnə versiya açıq qapı deməkdir." },
            { heading: "Ehtiyat nüsxə (backup)", body: "Vacib faylların surətini başqa yerdə saxla (bulud və ya xarici disk). Fidyə proqramı və ya cihazın itməsi halında yeganə xilas budur." },
          ],
          tasks: [
            { id: "kt5-zererli-l3-t1", type: "multiple_choice", prompt: "Proqram yeniləməsi niyə vacibdir?", options: ["Təhlükəsizlik deşiklərini bağlayır", "Ekranı böyüdür", "Batareyanı artırır", "İnterneti ucuzlaşdırır"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t2", type: "multiple_choice", prompt: "Ehtiyat nüsxə (backup) nə deməkdir?", options: ["Faylların başqa yerdə saxlanan surəti", "Faylın silinməsi", "Faylın böyüdülməsi", "Faylın rənglənməsi"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t3", type: "multiple_choice", prompt: "Fidyə hücumundan sonra faylları nə xilas edə bilər?", options: ["Əvvəlcədən alınmış ehtiyat nüsxə", "Yeni telefon", "Sürətli internet", "Böyük ekran"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t4", type: "multiple_choice", prompt: "Antivirus nə vaxt yenilənməlidir?", options: ["Mütəmadi — yeni təhdidləri tanısın deyə", "Heç vaxt", "İldə bir dəfə", "Yalnız yoluxandan sonra"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t5", type: "numeric", prompt: "Ehtiyat nüsxəni həftədə 1 dəfə alırsan. 4 həftədə neçə nüsxə olur?", answer: 4, xp: 10 },
            { id: "kt5-zererli-l3-t6", type: "fill_blank", prompt: "Vacib faylların surətinə ______ nüsxə deyilir (bir söz).", accepted: ["ehtiyat", "Ehtiyat", "backup"], xp: 10 },
            { id: "kt5-zererli-l3-t7", type: "multiple_choice", prompt: "İşlətmədiyin tətbiqləri silmək niyə faydalıdır?", options: ["Risk və icazə sayı azalır", "Ekran böyüyür", "İnternet sürətlənir mütləq", "Batareya iki qat olur"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t8", type: "multiple_choice", prompt: "Cihazda 'avtomatik yeniləmə'ni açmaq nə verir?", options: ["Yamalar vaxtında qurulur", "Yaddaş artır", "Ekran parlaqlaşır", "Səs güclənir"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t9", type: "multiple_choice", prompt: "Ən yaxşı qorunma vərdişi hansıdır?", options: ["Şübhəli linkə/fayla toxunmamaq", "Antivirusun olması kifayətdir", "Telefonu söndürmək", "Ekranı bağlamaq"], correctIndex: 0, xp: 10 },
            { id: "kt5-zererli-l3-t10", type: "multiple_choice", prompt: "Ehtiyat nüsxəni harada saxlamaq daha düzgündür?", options: ["Cihazdan AYRI yerdə (bulud/xarici disk)", "Eyni cihazın içində", "Eyni qovluqda", "Zibil qutusunda"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-zererli-l3-b1", type: "multiple_choice", prompt: "'Sıfır gün' (zero-day) zəiflik nə deməkdir?", options: ["Hələ yaması olmayan yeni tapılmış zəiflik", "Sıfır qiymətli proqram", "Bir günlük abunə", "Sıfır ölçülü fayl"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l3-b2", type: "multiple_choice", prompt: "3-2-1 qaydası (backup) nəyi bildirir?", options: ["3 surət, 2 fərqli daşıyıcı, 1 başqa yerdə", "3 parol, 2 telefon, 1 kompüter", "3 tətbiq, 2 oyun, 1 film", "3 saat, 2 gün, 1 həftə"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l3-b3", type: "multiple_choice", prompt: "Antivirus 100% qoruyurmu?", options: ["Xeyr — vərdişlər də vacibdir", "Bəli, tam qoruyur", "Yalnız gecə qoruyur", "Yalnız oyunda qoruyur"], correctIndex: 0, xp: 15 },
            { id: "kt5-zererli-l3-b4", type: "multiple_choice", prompt: "Şübhəli fayl haqda kimə məlumat verməlisən?", options: ["Valideyn/müəllim və ya IT məsul şəxsə", "Heç kimə", "Yalnız dostuna", "Sosial şəbəkəyə"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-zererli-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Birinci bölməni bitirdin! Sandığı aç.",
          tasks: [],
        },
        {
          id: "kt5-zererli-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Zərərli proqramlar bölməsinin yekun testi.",
          tasks: [],
        },
      ],
    },

    // ═══════════════ 2. Şəbəkə və cihaz təhlükəsizliyi ═══════════════
    {
      id: "kt5-sebeke",
      title: "Şəbəkə və cihaz təhlükəsizliyi",
      description: "İctimai Wi-Fi, HTTPS, ekran kilidi və tətbiq icazələri.",
      lessons: [
        {
          id: "kt5-sebeke-l1",
          title: "İctimai Wi-Fi və HTTPS",
          intro: "Kafedəki pulsuz Wi-Fi rahatdır, amma hər iş üçün uyğun deyil.",
          sections: [
            { heading: "İctimai şəbəkə", body: "Pulsuz Wi-Fi-da başqaları da eyni şəbəkədədir. Orada bank, ödəniş və vacib hesablara girmək riskə düşmək deməkdir. Belə işləri mobil internetlə və ya ev şəbəkəsində gör." },
            { heading: "Kilid işarəsi (HTTPS)", body: "Ünvan sətrində 'https' və kilid işarəsi məlumatın şifrələndiyini bildirir. 'http' (kilidsiz) saytda parol yazma. Ancaq kilid işarəsi saytın DÜRÜST olduğunu yox, yalnız şifrələndiyini göstərir." },
          ],
          tasks: [
            { id: "kt5-sebeke-l1-t1", type: "multiple_choice", prompt: "İctimai Wi-Fi-da nə etmək riskli deyil?", options: ["Dərs videosuna baxmaq", "Bank hesabına girmək", "Kart məlumatı yazmaq", "Parol dəyişmək"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t2", type: "multiple_choice", prompt: "'https' nə deməkdir?", options: ["Məlumat şifrələnib ötürülür", "Sayt pulsuzdur", "Sayt sürətlidir", "Sayt yeni açılıb"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t3", type: "multiple_choice", prompt: "Kilid işarəsi saytın dürüst olduğunu sübut edirmi?", options: ["Xeyr, yalnız şifrələnməni göstərir", "Bəli, tam sübut edir", "Yalnız mağazalarda", "Yalnız oyunlarda"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t4", type: "multiple_choice", prompt: "Naməlum adlı açıq Wi-Fi şəbəkəsi görürsən. Nə edirsən?", options: ["Qoşulmuram", "Dərhal qoşuluram", "Parolları yoxlayıram", "Ödəniş edirəm"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t5", type: "multiple_choice", prompt: "'http' (kilidsiz) saytda nə etmək olmaz?", options: ["Parol və kart məlumatı yazmaq", "Xəbər oxumaq", "Şəkil baxmaq", "Video izləmək"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t6", type: "fill_blank", prompt: "Ünvan sətrindəki ______ işarəsi məlumatın şifrələndiyini göstərir (bir söz).", accepted: ["kilid", "Kilid", "qıfıl"], xp: 10 },
            { id: "kt5-sebeke-l1-t7", type: "multiple_choice", prompt: "Ev Wi-Fi şəbəkəsinin parolu olmalıdırmı?", options: ["Bəli, mütləq güclü parol", "Xeyr, lazım deyil", "Yalnız gecə", "Yalnız qonaq gələndə"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t8", type: "multiple_choice", prompt: "Vacib iş üçün ictimai Wi-Fi əvəzinə nə daha yaxşıdır?", options: ["Mobil internet (öz paketin)", "Qonşunun şəbəkəsi", "Açıq şəbəkə", "Fərqi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t9", type: "multiple_choice", prompt: "Wi-Fi-a avtomatik qoşulma niyə söndürülməlidir?", options: ["Naməlum şəbəkəyə özbaşına qoşulmasın deyə", "Batareya üçün yalnız", "Ekran üçün", "Səs üçün"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l1-t10", type: "multiple_choice", prompt: "Saytın ünvanını yoxlayarkən nəyə diqqət edirsən?", options: ["Düzgün yazılışına (hərf oyunlarına)", "Rənginə", "Şriftinə", "Uzunluğuna"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-sebeke-l1-b1", type: "multiple_choice", prompt: "'Şifrələmə' nə deməkdir?", options: ["Məlumatın yalnız düzgün tərəfin oxuya biləcəyi formaya salınması", "Faylın kiçildilməsi", "Şəklin rənglənməsi", "Səsin artırılması"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l1-b2", type: "multiple_choice", prompt: "Saxta Wi-Fi nöqtəsi (məs. 'Free_WiFi') nə üçün qurulur?", options: ["İstifadəçilərin məlumatını toplamaq üçün", "İnternet paylamaq üçün", "Reklam üçün", "Oyun üçün"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l1-b3", type: "multiple_choice", prompt: "VPN nə edir (sadə izah)?", options: ["Trafiki şifrələyib gizli tunel yaradır", "İnterneti pulsuz edir", "Telefonu sürətləndirir", "Oyunu asanlaşdırır"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l1-b4", type: "multiple_choice", prompt: "Brauzer 'bu sayt təhlükəsiz deyil' xəbərdarlığı verir. Nə edirsən?", options: ["Səhifəni bağlayıram", "Davam edirəm", "Parol yazıram", "Kart məlumatı yazıram"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-sebeke-l2",
          title: "Cihazını kilidlə",
          intro: "Telefonun kiliddirsə, itsə belə məlumatın qorunur.",
          sections: [
            { heading: "Ekran kilidi", body: "PIN, naxış, barmaq izi və ya üz kilidi — cihazın ilk qapısıdır. Kilid olmadan telefonu tapan hər kəs bütün hesablarına girə bilər." },
            { heading: "İtən cihaz", body: "Telefon itsə: 'Cihazımı tap' funksiyası ilə yerini görmək, uzaqdan kilidləmək və məlumatı silmək olar. Bunun üçün funksiya ƏVVƏLCƏDƏN açıq olmalıdır." },
          ],
          tasks: [
            { id: "kt5-sebeke-l2-t1", type: "multiple_choice", prompt: "Ekran kilidi nə üçündür?", options: ["Cihaza icazəsiz girişi əngəlləmək", "Batareyanı doldurmaq", "İnterneti sürətləndirmək", "Şəkli gözəlləşdirmək"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t2", type: "multiple_choice", prompt: "Hansı PIN daha zəifdir?", options: ["1234", "8371", "5927", "6408"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t3", type: "multiple_choice", prompt: "Telefonun itdi. İlk nə etməlisən?", options: ["Böyüyə deyib 'cihazımı tap' ilə kilidləmək", "Gözləmək", "Heç nə", "Yeni telefon almaq"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t4", type: "multiple_choice", prompt: "'Cihazımı tap' funksiyası nə vaxt işə yarayır?", options: ["Əvvəlcədən açılıbsa", "Sonradan açsan da", "Heç vaxt", "Yalnız yeni telefonda"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t5", type: "multiple_choice", prompt: "Ekran kilidi parolunu kimlə paylaşmaq olar?", options: ["Valideynlə", "Sinif yoldaşları ilə", "Onlayn dostla", "Hamı ilə"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t6", type: "fill_blank", prompt: "Telefonun ilk qapısı ______ kilididir (bir söz).", accepted: ["ekran", "Ekran"], xp: 10 },
            { id: "kt5-sebeke-l2-t7", type: "multiple_choice", prompt: "Avtomatik kilidlənmə vaxtı nə qədər olmalıdır?", options: ["Qısa (məs. 30 saniyə – 1 dəqiqə)", "10 dəqiqə", "1 saat", "Heç vaxt kilidlənməsin"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t8", type: "multiple_choice", prompt: "Barmaq izi kilidi PIN-dən nə ilə üstündür?", options: ["Sürətlidir və çiynindən baxıb öyrənmək olmur", "Rəngi var", "Səsi var", "İnternet tələb edir"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t9", type: "multiple_choice", prompt: "Kilid ekranında bildirişlərin tam mətni görünsün?", options: ["Xeyr, məxfi məlumat görünə bilər", "Bəli, rahatdır", "Yalnız gecə", "Fərqi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l2-t10", type: "multiple_choice", prompt: "Kompüteri açıq qoyub gedirsən. Doğru davranış?", options: ["Kilidləyib getmək", "Açıq qoymaq", "Sadəcə ekranı bağlamaq", "Səsi azaltmaq"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-sebeke-l2-b1", type: "multiple_choice", prompt: "Cihaz şifrələnməsi (encryption) nə verir?", options: ["Cihaz oğurlansa belə məlumat oxunmur", "Batareya artır", "Ekran böyüyür", "İnternet sürətlənir"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l2-b2", type: "multiple_choice", prompt: "Uzaqdan silmə (remote wipe) nə vaxt lazım olur?", options: ["Cihaz tapılmayanda və məlumat həssas olanda", "Batareya bitəndə", "İnternet kəsiləndə", "Oyun yükləyəndə"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l2-b3", type: "multiple_choice", prompt: "Naxış kilidinin zəif tərəfi nədir?", options: ["Ekranda iz qalır və uzaqdan baxıb öyrənmək asandır", "Çox uzundur", "Rəngsizdir", "Batareya yeyir"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l2-b4", type: "multiple_choice", prompt: "Köhnə telefonu satmadan əvvəl nə etməlisən?", options: ["Hesablardan çıxıb zavod sıfırlaması etmək", "Şəkilləri paylaşmaq", "Parolu qutuya yazmaq", "Heç nə"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-sebeke-l3",
          title: "Tətbiq icazələri",
          intro: "Fənərcik tətbiqinə mikrofon icazəsi niyə lazımdır? Sual ver.",
          sections: [
            { heading: "İcazə nədir?", body: "Tətbiq kameraya, mikrofona, yerə, kontaktlara və şəkillərə çıxış üçün SƏNDƏN icazə istəyir. İcazəni verib-verməmək sənin qərarındır və sonradan dəyişmək olar." },
            { heading: "Məntiq yoxlaması", body: "İcazə tətbiqin işinə uyğun olmalıdır: xəritəyə yer icazəsi məntiqlidir, sadə oyuna kontaktlar icazəsi şübhəlidir. Şübhələnəndə 'İmtina et' seç — tətbiq işləməsə sonra verə bilərsən." },
          ],
          tasks: [
            { id: "kt5-sebeke-l3-t1", type: "multiple_choice", prompt: "Tətbiq icazəsi nədir?", options: ["Tətbiqin kamera/mikrofon/yerə çıxış hüququ", "Tətbiqin qiyməti", "Tətbiqin rəngi", "Tətbiqin ölçüsü"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t2", type: "multiple_choice", prompt: "Fənərcik tətbiqi kontaktlara icazə istəyir. Bu necədir?", options: ["Şübhəlidir, imtina edirəm", "Normaldır", "Mütləq verməliyəm", "Yaxşı əlamətdir"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t3", type: "multiple_choice", prompt: "İcazəni sonradan dəyişmək olarmı?", options: ["Bəli, ayarlardan", "Xeyr, heç vaxt", "Yalnız tətbiqi silməklə", "Yalnız yeni telefonda"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t4", type: "multiple_choice", prompt: "Hansı icazə xəritə tətbiqi üçün məntiqlidir?", options: ["Yer (məkan)", "Kontaktlar", "SMS", "Zəng jurnalı"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t5", type: "multiple_choice", prompt: "'Həmişə icazə ver' yerinə hansı seçim daha təhlükəsizdir?", options: ["'Yalnız tətbiqdən istifadə edərkən'", "'Həmişə'", "'Heç vaxt soruşma'", "Fərqi yoxdur"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t6", type: "fill_blank", prompt: "Şübhəli icazə istəyində ən doğru seçim ______ etməkdir (imtina).", accepted: ["imtina", "İmtina", "rədd"], xp: 10 },
            { id: "kt5-sebeke-l3-t7", type: "multiple_choice", prompt: "Mikrofon icazəsi verilən tətbiq nə edə bilər?", options: ["Səsi qeyd edə bilər", "Şəkil çəkə bilməz heç vaxt", "İnterneti sürətləndirir", "Batareyanı doldurur"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t8", type: "multiple_choice", prompt: "Oyun 'şəkillərə tam giriş' istəyir. Nə edirsən?", options: ["İmtina edirəm, lazımdırsa böyüyə göstərirəm", "Verirəm", "Bütün icazələri verirəm", "Tətbiqi dostuma göndərirəm"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t9", type: "multiple_choice", prompt: "İcazələri nə vaxt yoxlamaq faydalıdır?", options: ["Vaxtaşırı — köhnə tətbiqlərin icazəsini silmək üçün", "Heç vaxt", "Yalnız alanda", "Yalnız satanda"], correctIndex: 0, xp: 10 },
            { id: "kt5-sebeke-l3-t10", type: "multiple_choice", prompt: "Kamera icazəsi verilmiş tətbiqi silsən nə olur?", options: ["İcazə də aradan qalxır", "İcazə qalır", "Kamera sınır", "Şəkillər silinir"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-sebeke-l3-b1", type: "multiple_choice", prompt: "'Ən az səlahiyyət' prinsipi nə deməkdir?", options: ["Yalnız işi üçün mütləq lazım olan icazəni ver", "Bütün icazələri ver", "Heç bir icazə vermə", "İcazələri gizlə"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l3-b2", type: "multiple_choice", prompt: "Telefonda yaşıl/narıncı nöqtə görünür. Bu nə deməkdir?", options: ["Kamera və ya mikrofon istifadə olunur", "Batareya azdır", "İnternet var", "Yeni mesaj var"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l3-b3", type: "multiple_choice", prompt: "Pulsuz tətbiq çox icazə istəyirsə, ehtimal nədir?", options: ["Məlumatını toplayıb satır", "Daha yaxşı işləyir", "Daha sürətlidir", "Daha az yer tutur"], correctIndex: 0, xp: 15 },
            { id: "kt5-sebeke-l3-b4", type: "multiple_choice", prompt: "Uşaq hesabında valideyn nəzarəti nə üçündür?", options: ["Uyğunsuz məzmun və icazələri məhdudlaşdırmaq", "Oyunu sürətləndirmək", "İnterneti ucuzlaşdırmaq", "Ekranı böyütmək"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-sebeke-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Şəbəkə bölməsini bitirdin! Sandığı aç.",
          tasks: [],
        },
        {
          id: "kt5-sebeke-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Şəbəkə və cihaz təhlükəsizliyi — yekun test.",
          tasks: [],
        },
      ],
    },

    // ═══════════════ 3. Sosial mühəndislik və bərpa ═══════════════
    {
      id: "kt5-berpa",
      title: "Sosial mühəndislik və bərpa",
      description: "Hücum insanı hədəf alanda necə tanımalı və hesab oğurlananda nə etməli.",
      lessons: [
        {
          id: "kt5-berpa-l1",
          title: "Sosial mühəndislik nədir?",
          intro: "Ən zəif halqa proqram deyil — tələsdirilən insandır.",
          sections: [
            { heading: "Tərif", body: "Sosial mühəndislik — texnologiyanı yox, İNSANI aldatmaqdır. Fırıldaqçı özünü dəstək işçisi, müəllim, qohum və ya oyun admini kimi göstərib məlumat və ya kod istəyir." },
            { heading: "Üç əlamət", body: "1) TƏLƏSDİRMƏ ('5 dəqiqən var'), 2) QORXUTMA ('hesabın bağlanacaq'), 3) GİZLİLİK ('heç kimə demə'). Bu üçü bir yerdə görünürsə, demək olar həmişə fırıldaqdır. Dayan və böyüyə de." },
          ],
          tasks: [
            { id: "kt5-berpa-l1-t1", type: "multiple_choice", prompt: "Sosial mühəndislik nəyi hədəf alır?", options: ["İnsanı (aldatmaqla)", "Kompüterin ekranını", "Batareyanı", "Klaviaturanı"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t2", type: "multiple_choice", prompt: "Hansı fırıldaq əlamətidir?", options: ["Tələsdirmə və 'heç kimə demə'", "Salamlaşma", "Sual verilməsi", "Uzun mətn"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t3", type: "multiple_choice", prompt: "Özünü 'oyun admini' kimi tanıdan biri parolunu istəyir. Nə edirsən?", options: ["Vermirəm — real admin parol istəmir", "Verirəm", "Kod göndərirəm", "Hesabı bağlayıram"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t4", type: "multiple_choice", prompt: "Telefonuna gələn təsdiq kodunu başqasına vermək olarmı?", options: ["Heç vaxt", "Dostuna olar", "Adminə olar", "Qohuma olar"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t5", type: "multiple_choice", prompt: "'Hesabın 10 dəqiqəyə silinəcək!' mesajı nədir?", options: ["Qorxutma ilə tələsdirmə — fırıldaq əlaməti", "Rəsmi xəbərdarlıq", "Yeni qayda", "Oyun mükafatı"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t6", type: "fill_blank", prompt: "Fırıldaqçının ən çox istifadə etdiyi üsul ______ (insanı tələsdirmək) adlanır.", accepted: ["tələsdirmə", "telesdirme", "təzyiq"], xp: 10 },
            { id: "kt5-berpa-l1-t7", type: "multiple_choice", prompt: "Dostunun hesabından qəribə pul istəyi gəldi. Nə edirsən?", options: ["Başqa yolla (zəng) təsdiq edirəm", "Dərhal göndərirəm", "Kart məlumatı yazıram", "Paylaşıram"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t8", type: "multiple_choice", prompt: "Real texniki dəstək nə vaxt parol istəyir?", options: ["Heç vaxt", "Həmişə", "Yalnız gecə", "Yalnız e-poçtla"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t9", type: "multiple_choice", prompt: "Ən yaxşı müdafiə nədir?", options: ["Dayanmaq, tələsməmək, böyüyə demək", "Sürətli cavab vermək", "Mesajı silmək", "Şərh yazmaq"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l1-t10", type: "multiple_choice", prompt: "'Pulsuz oyun pulu verim, hesabına girim' təklifi nədir?", options: ["Hesab oğurluğu cəhdi", "Kömək", "Hədiyyə", "Yeniləmə"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-berpa-l1-b1", type: "multiple_choice", prompt: "Niyə fırıldaqçılar tələsdirir?", options: ["Düşünüb yoxlamağa vaxt qalmasın deyə", "Sürət xoşlarına gəlir", "İnternet baha olduğu üçün", "Mesaj qısa olsun deyə"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l1-b2", type: "multiple_choice", prompt: "'Vişinq' (səslə fırıldaq) nədir?", options: ["Telefon zəngi ilə aldatmaq", "Şəkillə aldatmaq", "Video ilə aldatmaq", "Oyunla aldatmaq"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l1-b3", type: "multiple_choice", prompt: "Sənə 'yalnız sən seçilmisən' deyilirsə nə düşünürsən?", options: ["Xüsusi hiss etdirib inandırma üsuludur", "Doğrudan da xüsusiyəm", "Mütləq həqiqətdir", "Mükafat qazanmışam"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l1-b4", type: "multiple_choice", prompt: "Fırıldağı bildirmək (şikayət) niyə vacibdir?", options: ["Başqalarının da qorunmasına kömək edir", "Xal qazandırır", "Sürət artırır", "Heç nə vermir"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-berpa-l2",
          title: "Hesabım oğurlandı — nə etməli?",
          intro: "Panika yox, ardıcıl addımlar: dəyiş, çıxart, xəbərdar et.",
          sections: [
            { heading: "Addımlar", body: "1) Parolu DƏRHAL dəyiş (başqa cihazdan). 2) 'Bütün cihazlardan çıxış' et. 3) İki addımlı təsdiqi aç. 4) Bərpa e-poçtu/nömrəsini yoxla — dəyişdirilibsə düzəlt. 5) Dostlarını xəbərdar et. 6) Böyüyə de və platformaya şikayət et." },
            { heading: "Sonra", body: "Eyni parolu işlətdiyin BAŞQA hesabları da dəyiş. Fırıldaqçı bir parolu tapıbsa, ilk işi onu başqa saytlarda sınamaq olur." },
          ],
          tasks: [
            { id: "kt5-berpa-l2-t1", type: "multiple_choice", prompt: "Hesabın oğurlandığını başa düşdün. İlk addım?", options: ["Parolu dəyişmək", "Şəkil paylaşmaq", "Gözləmək", "Hesabı silmək"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t2", type: "multiple_choice", prompt: "'Bütün cihazlardan çıxış' nə üçün lazımdır?", options: ["Fırıldaqçının açıq sessiyasını bağlamaq üçün", "Yaddaş üçün", "Sürət üçün", "Ekran üçün"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t3", type: "multiple_choice", prompt: "Eyni parolu başqa saytda da işlədirsənsə nə etməlisən?", options: ["Onları da dəyişmək", "Saxlamaq", "Yazıb qoymaq", "Dostuna demək"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t4", type: "multiple_choice", prompt: "İki addımlı təsdiq (2FA) nə verir?", options: ["Parol bilinsə də kodsuz girilmir", "İnterneti sürətləndirir", "Yaddaş artırır", "Reklam azaldır"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t5", type: "multiple_choice", prompt: "Bərpa e-poçtu dəyişdirilibsə bu nə deməkdir?", options: ["Fırıldaqçı hesabı özünə bağlamağa çalışır", "Sistem yenilənib", "Normal haldır", "E-poçt köhnəlib"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t6", type: "fill_blank", prompt: "Hesab oğurlananda ilk növbədə ______ dəyişdirilməlidir (bir söz).", accepted: ["parol", "parolu", "Parol"], xp: 10 },
            { id: "kt5-berpa-l2-t7", type: "multiple_choice", prompt: "Dostlarını niyə xəbərdar etməlisən?", options: ["Sənin adından mesaj gedə bilər", "Xal qazansınlar", "Oyun oynasınlar", "Şəkil göndərsinlər"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t8", type: "multiple_choice", prompt: "Parolu hansı cihazdan dəyişmək daha düzgündür?", options: ["Təmiz olduğuna əmin olduğun cihazdan", "Yoluxmuş cihazdan", "İctimai kompüterdən", "Dostun telefonundan"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t9", type: "multiple_choice", prompt: "Hesab bərpası zamanı böyüyə demək niyə vacibdir?", options: ["Kömək edə və rəsmi müraciət yaza bilər", "Xal verir", "Sürət artırır", "Lazım deyil"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l2-t10", type: "numeric", prompt: "Dərsdəki bərpa addımlarından neçəsi parolla bağlıdır (dəyişmək + başqa saytlarda dəyişmək)?", answer: 2, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-berpa-l2-b1", type: "multiple_choice", prompt: "'Parolların sızması' (data breach) nə deməkdir?", options: ["Saytdan istifadəçi parollarının oğurlanması", "İnternetin kəsilməsi", "Saytın bağlanması", "Faylın böyüməsi"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l2-b2", type: "multiple_choice", prompt: "Bərpa kodlarını (backup codes) harada saxlamaq düzgündür?", options: ["Təhlükəsiz, oflayn yerdə", "Söhbətdə", "Sosial şəbəkədə", "Masaüstündə açıq faylda"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l2-b3", type: "multiple_choice", prompt: "Hesabın 'giriş tarixçəsi' nə göstərir?", options: ["Hansı cihaz və yerdən girildiyini", "Şəkillərin sayını", "Dostların sayını", "Oyun xallarını"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l2-b4", type: "multiple_choice", prompt: "Parol meneceri nə üçün faydalıdır?", options: ["Hər sayta ayrı güclü parol saxlayır", "Oyunu sürətləndirir", "İnterneti ucuzlaşdırır", "Şəkil redaktə edir"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-berpa-l3",
          title: "Kim hücum edir və niyə?",
          intro: "Hücumun səbəbini bilsən, hədəf olduğunu da tez başa düşürsən.",
          sections: [
            { heading: "Motivlər", body: "Çoxu PUL üçün (hesab satmaq, fırıldaq), bəzisi MƏLUMAT üçün, bəzisi isə zarafat/şöhrət üçün edir. Uşaq hesabları da hədəfdir: oyun əşyaları və valideyn kartı ilə bağlı ola bilər." },
            { heading: "Ağ papaqlar", body: "Bütün hakerlər pis deyil: 'ağ papaq' mütəxəssislər sistemləri İCAZƏ İLƏ yoxlayıb zəiflikləri düzəltdirirlər. Başqasının hesabına icazəsiz girmək isə — zarafat da olsa — qanunla cəzalandırılır." },
          ],
          tasks: [
            { id: "kt5-berpa-l3-t1", type: "multiple_choice", prompt: "Hücumların əsas səbəbi nədir?", options: ["Pul qazanmaq", "Əylənmək yalnız", "Şəkil toplamaq", "Səbəb yoxdur"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t2", type: "multiple_choice", prompt: "Uşaq hesabları niyə hədəf olur?", options: ["Oyun əşyaları və zəif qorunma səbəbindən", "Çünki maraqsızdır", "Çünki boşdur", "Heç vaxt hədəf olmur"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t3", type: "multiple_choice", prompt: "'Ağ papaq' mütəxəssis nə edir?", options: ["İcazə ilə zəiflikləri tapıb düzəltdirir", "Hesab oğurlayır", "Virus yazır", "Reklam yayır"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t4", type: "multiple_choice", prompt: "Dostunun hesabına zarafatla girmək olarmı?", options: ["Xeyr, bu qanunsuzdur", "Bəli, zarafatdır", "Yalnız icazəsiz olsa", "Yalnız məktəbdə"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t5", type: "multiple_choice", prompt: "Kibertəhlükəsizlik mütəxəssisi nə işlə məşğuldur?", options: ["Sistemləri hücumlardan qoruyur", "Oyun düzəldir", "Video çəkir", "Kitab yazır"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t6", type: "fill_blank", prompt: "İcazə ilə zəiflik axtaran mütəxəssisə ______ papaq haker deyilir (rəng).", accepted: ["ağ", "Ağ", "ag"], xp: 10 },
            { id: "kt5-berpa-l3-t7", type: "multiple_choice", prompt: "Oyun hesabını satmaq təklifi gəldi. Nə edirsən?", options: ["Qəbul etmirəm, böyüyə deyirəm", "Satıram", "Parolu verirəm", "Kartı yazıram"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t8", type: "multiple_choice", prompt: "Kibertəhlükəsizliyin əsas prinsipi hansıdır?", options: ["Qorunma vərdiş və addımların cəmidir", "Bir proqram kifayətdir", "Yalnız parol lazımdır", "Yalnız antivirus lazımdır"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t9", type: "multiple_choice", prompt: "Zəiflik tapdın (məs. məktəb saytında). Doğru davranış?", options: ["Məsul şəxsə xəbər vermək", "İstismar etmək", "Dostlara paylaşmaq", "Sosial şəbəkədə yazmaq"], correctIndex: 0, xp: 10 },
            { id: "kt5-berpa-l3-t10", type: "multiple_choice", prompt: "Bu fənndə öyrəndiyin ən vacib qayda hansıdır?", options: ["Şübhələn, yoxla, böyüyə de", "Hər linkə klikləmə cəsarəti", "Antivirus kifayətdir", "Parolu paylaş"], correctIndex: 0, xp: 10 },
          ],
          bonusTasks: [
            { id: "kt5-berpa-l3-b1", type: "multiple_choice", prompt: "'Bug bounty' proqramı nədir?", options: ["Şirkətin zəiflik tapanlara mükafat verməsi", "Oyun turniri", "Reklam kampaniyası", "Virus növü"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l3-b2", type: "multiple_choice", prompt: "Niyə 'təhlükəsizlik bir dəfəlik iş deyil'?", options: ["Yeni təhdidlər daim yaranır", "Proqramlar bahalaşır", "İnternet dəyişir", "Cihazlar köhnəlir"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l3-b3", type: "multiple_choice", prompt: "Kibertəhlükəsizlik peşəsi üçün hansı bacarıq vacibdir?", options: ["Diqqətli düşüncə və öyrənmə həvəsi", "Sürətli yazmaq", "Yüksək səs", "Uzun boy"], correctIndex: 0, xp: 15 },
            { id: "kt5-berpa-l3-b4", type: "multiple_choice", prompt: "Ən yaxşı şəxsi qayda hansıdır?", options: ["Şübhələndinsə dayan və böyüyə de", "Heç kimə güvənmə", "Heç nə yükləmə", "İnternetə çıxma"], correctIndex: 0, xp: 15 },
          ],
        },
        {
          id: "kt5-berpa-chest",
          title: "Sandıq",
          kind: "chest",
          intro: "Fənni bitirirsən! Sandığı aç.",
          tasks: [],
        },
        {
          id: "kt5-berpa-test",
          title: "Bölmə sonu test",
          kind: "test",
          intro: "Sosial mühəndislik və bərpa — yekun test.",
          tasks: [],
        },
      ],
    },
  ],
};
