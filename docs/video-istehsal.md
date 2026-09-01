# Video istehsal təlimatı

Bu sənəd 806 dərsin videosunu **konveyerlə** çəkmək üçündür. Hər videonu ayrıca layihə kimi
çəksək, 100-cü videoda dayanacağıq — ona görə burada hər şey şablonlaşdırılıb: skript forması,
çəkiliş ayarı, fayl adı, yükləmə.

---

## 1. İş axını (bir video = 4 addım)

1. **Skript yaz** — aşağıdakı şablonla, 250–300 söz.
2. **Yaz (çək)** — ekran + səs, partiya ilə (bir oturuşda 8–10 video).
3. **Emal et** — `bash scripts/encode-video.sh xam.mp4 <dərs-id>` → sıxılmış mp4 + poster.
4. **Bağla** — `/admin/ders-videolari` səhifəsindən (link siyahısı və ya fayl yükləmə).

Fayl adı **həmişə dərs id-si** olmalıdır: `ry5-kesrler-l2.mp4`. Toplu yükləmə uyğunlaşdırmanı
məhz bu ada görə edir. Dərs id-lərinin siyahısını həmin səhifədəki **«Növbəni CSV»** düyməsi verir.

---

## 2. Skript şablonu

Struktur pedaqoji ardıcıllığa görədir: **qarmaq → qayda → həll nümunəsi → tipik səhv → yekun**.
Bu ardıcıllığı dəyişməyin — "həll nümunəsi" hissəsi videonun əsl dəyəridir, qalanı çərçivədir.

```
[QARMAQ — 1 cümlə, 5–8 saniyə]
Şagirdin tanıdığı bir vəziyyət və ya sual. Tərif yox.

[QAYDA — 2–3 cümlə, 20–25 saniyə]
Qaydanı bir dəfə, sadə dillə. Ekranda eyni sözləri YAZMA — səslə deyilən və
ekranda görünən fərqli olmalıdır (biri sözlə, biri şəkil/nümunə ilə).

[HƏLL NÜMUNƏSİ — 60–90 saniyə]
Bir konkret məsələni addım-addım həll et. Hər addımda NİYƏ belə etdiyini de.
Ekranda addımlar bir-bir görünür, hamısı birdən yox.

[TİPİK SƏHV — 15–20 saniyə]
"Ən çox belə səhv edirlər: …" — səhvi göstər, sonra düzəlt.
Bu hissə videonun ən çox yadda qalan yeridir.

[YEKUN — 5–10 saniyə]
Bir cümlə: nə öyrəndik. Sonra "indi məşq edək" ilə bitir.
```

**Uzunluq:** 90–180 saniyə. 3 dəqiqədən uzun video 1–8 sinifdə diqqəti itirir; mövzu uzundursa
onu iki dərsə bölün.

---

## 3. Yazma qaydaları

| Qayda | Səbəb |
|---|---|
| **Səs birinci** — sabit səviyyə, əks-səda olmayan otaq | Pis səs pis şəkildən qat-qat çox zərər verir |
| **720p kifayətdir** | 1080p yalnız faylı böyüdür, mobil internetdə fayda vermir |
| Ekrandakı **mətni səslə eynən oxuma** | Eyni məlumatın iki kanalı bir-birini pozur |
| **Bəzək detalı yoxdur** — mövzuya aid olmayan "maraqlı fakt", animasiya | Diqqəti yayındırır və öyrənməni azaldır |
| **Ölü vaxt kəsilir** — pauza, "ee", uzun giriş | 10 saniyə itirilən diqqət geri qayıtmır |
| Danışıq **sadə cümlələrlə**, sürət orta | 3-cü sinif şagirdi üçün yazılır, müəllim üçün yox |

---

## 4. Fayl və emal

```bash
# Xam yazıdan hazır videoya: sıxır, poster kadrı çıxarır, ölçünü yoxlayır
bash scripts/encode-video.sh xam-yazi.mp4 ry5-kesrler-l2

# Nəticə:
#   public/videos/ry5-kesrler-l2.mp4
#   public/videos/ry5-kesrler-l2.jpg
```

**Ölçülmüş həcm (720p, CRF 26):** slayd + səsli izah ≈ **5 MB/dəqiqə**.
Yəni 806 dərs × 2.5 dəq ≈ **10 GB**.

### Harada saxlanılır

| Yol | Nə vaxt |
|---|---|
| **YouTube (siyahıya salınmayan)** | Əsas yol. Pulsuz, limitsiz, zəif internetdə keyfiyyəti özü aşağı salır. Linki `/admin/ders-videolari`-də toplu bağlayırsan. |
| **Supabase Storage** | Yalnız az sayda video üçün — pulsuz səviyyə 1 GB (≈ 80 video). |
| **Cloudflare R2** | Gəlir gələndə: 10 GB pulsuz saxlanc, çıxış trafiki pulsuz. |

Pleyer hər üç halda işləyir: YouTube linki iframe-ə, mp4 nativ `<video>`-ya düşür.

---

## 5. Altyazı (.vtt)

Hər videoda altyazı olmalıdır: səssiz izləyən şagird, eşitmə çətinliyi olan şagird və
axtarış üçün. Fayl adı yenə dərs id-si ilə eynidir: `ry5-kesrler-l2.vtt`.

```vtt
WEBVTT

00:00:00.000 --> 00:00:04.500
Kəsrləri toplayanda məxrəclər eyni olmalıdır.

00:00:04.500 --> 00:00:09.000
Gəlin birlikdə bir nümunəyə baxaq.
```

`/admin/ders-videolari` → **Fayl yüklə** bölməsinə `.vtt` atsan, videonu əvəz etmir —
altyazı kimi bağlanır.

---

## 6. Çəkiliş növbəsi

Sıralama təxminlə deyil, **data ilə** müəyyən olunur: `/admin/ders-videolari` → **Növbə**
bölməsi videosu olmayan dərsləri **cəhd sayına görə** göstərir. Şagirdlərin faktiki toxunduğu
dərs birinci çəkilir — 806 dərsin hamısı bitənə qədər ən çox fayda verən sıra budur.

«Növbəni CSV» düyməsi həmin siyahını cədvəl kimi verir: komanda içində çəkiliş planı orada
aparılır (kim, hansı dərs, hansı tarix).

---

## 7. Nümunə skriptlər

### 7.1 Riyaziyyat — «Fərqli məxrəcli kəsrlərin toplanması» (5-ci sinif)

> **[QARMAQ]** Bir tortun yarısı sənin, dörddə biri qardaşının. Birlikdə tortun neçə hissəsi
> sizindir? Yarını dörddə birlə birbaşa toplaya bilmirik — gəlin görək niyə.
>
> **[QAYDA]** Kəsrləri toplamaq üçün onların məxrəci eyni olmalıdır. Məxrəclər fərqlidirsə,
> əvvəlcə ortaq məxrəc tapırıq: bir kəsri elə genişləndiririk ki, məxrəclər üst-üstə düşsün.
>
> **[HƏLL NÜMUNƏSİ]** 1/2 + 1/4 hesablayaq.
> Birinci addım: məxrəclərə baxıram — 2 və 4. 4 ədədi 2-yə bölünür, deməli ortaq məxrəc 4-dür.
> İkinci addım: 1/2-ni 4 məxrəcinə gətirirəm. Məxrəci 2 dəfə artırdım, ona görə surəti də
> 2 dəfə artırmalıyam: 1/2 = 2/4. Diqqət et — kəsrin qiyməti dəyişmədi, yalnız görünüşü dəyişdi.
> Üçüncü addım: indi məxrəclər eynidir, surətləri toplayıram: 2/4 + 1/4 = 3/4.
> Cavab: tortun dörddə üçü sizindir.
>
> **[TİPİK SƏHV]** Ən çox edilən səhv budur: surətləri də, məxrəcləri də toplamaq —
> 1/2 + 1/4 = 2/6. Bu, səhvdir. Məxrəc hissələrin ölçüsünü göstərir; ölçünü toplamırıq,
> yalnız hissələrin sayını toplayırıq.
>
> **[YEKUN]** Deməli: əvvəl ortaq məxrəc, sonra surətlərin toplanması. İndi özün məşq et.

### 7.2 Azərbaycan dili — «Söz kökü və şəkilçi» (3-cü sinif)

> **[QARMAQ]** «Kitab», «kitabçı», «kitabxana» — üç fərqli söz, amma hamısında bir ortaq hissə var.
> Tapdın?
>
> **[QAYDA]** Sözün mənasını daşıyan, dəyişməyən hissəsinə kök deyilir. Kökə əlavə olunub
> sözə yeni məna verən hissəyə isə şəkilçi deyilir.
>
> **[HƏLL NÜMUNƏSİ]** «Kitabxana» sözünü ayıraq.
> Birinci addım: sözün içində tanıdığım söz varmı? Bəli — «kitab». Bu, kökdür.
> İkinci addım: qalan hissə nədir? «-xana». Bu, şəkilçidir və «yer» mənası verir.
> Üçüncü addım: yoxlayaq — kitab + xana = kitabların saxlandığı yer. Məna uyğun gəldi.
> Eyni yolla: «kitabçı» = kitab + çı, yəni kitabla məşğul olan adam.
>
> **[TİPİK SƏHV]** Bəzən sözün əvvəlindəki hərfləri kök sanırlar: «kitabxana»da kök «kit» deyil.
> Kök həmişə **məna daşıyan tam söz** olmalıdır — «kit» burada məna vermir.
>
> **[YEKUN]** Kök mənanı daşıyır, şəkilçi mənanı dəyişir. İndi bir neçə sözü özün ayır.

### 7.3 Kibertəhlükəsizlik — «Sosial mühəndislik» (5-ci sinif)

> **[QARMAQ]** Telefonuna mesaj gəlir: «Hesabın 10 dəqiqəyə silinəcək! Kodu göndər».
> Ürəyin döyünür, tələsirsən — məhz bunu istəyirlər.
>
> **[QAYDA]** Sosial mühəndislik proqramı deyil, **insanı** aldatmaqdır. Fırıldaqçı özünü
> dəstək işçisi, oyun admini və ya qohum kimi göstərib məlumat istəyir.
>
> **[HƏLL NÜMUNƏSİ]** Belə mesajı üç əlamətə görə tanıyırıq.
> Birinci: **tələsdirmə** — «5 dəqiqən var». Real xidmət səni tələsdirmir.
> İkinci: **qorxutma** — «hesabın bağlanacaq». Qorxan adam yoxlamağı unudur.
> Üçüncü: **gizlilik** — «heç kimə demə». Düzgün istək gizlilik tələb etmir.
> Bu üçü bir yerdədirsə — demək olar həmişə fırıldaqdır. Doğru davranış: dayan, cavab yazma,
> böyüyə göstər.
>
> **[TİPİK SƏHV]** Ən çox edilən səhv telefona gələn **təsdiq kodunu** paylaşmaqdır.
> Həmin kod açardır — real dəstək işçisi onu heç vaxt soruşmur.
>
> **[YEKUN]** Tələsdirir, qorxudur və gizlilik istəyirsə — dayan və böyüyə de. İndi bir neçə
> nümunəyə baxaq.

---

## 8. Yoxlama siyahısı (video hazır sayılmadan əvvəl)

- [ ] Uzunluq 90–180 saniyə
- [ ] Səs səviyyəsi sabit, əks-səda yoxdur
- [ ] Həll nümunəsi addım-addımdır və hər addımda «niyə» izah olunur
- [ ] Tipik səhv göstərilib
- [ ] Ekrandakı mətn səslə eynən oxunmur
- [ ] Fayl adı dərs id-si ilə eynidir
- [ ] `.vtt` altyazı hazırdır
- [ ] `/admin/ders-videolari` səhifəsində dərsə bağlanıb və şagird tərəfdə açılır
