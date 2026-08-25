# İmparo pilotu — analiz planı

> Bu sənəd **pilot başlamazdan əvvəl** kilidlənir. Məqsəd: nəticə göründükdən
> sonra düsturu «uyğunlaşdırmaq» imkanını aradan qaldırmaq.
>
> Ölçmə dizaynı: [`measurement-design.md`](./measurement-design.md)

## 1. Mənimsəmə düsturu

Mənbə: `task_attempts` (migration 0044) + `tasks.data->'skills'` (bacarıq etiketi).

Bir şagird və bir bacarıq üçün, `[from, to)` pəncərəsində:

```
w(cəhd)  = exp(−ln2 · (to − cəhd_vaxtı) / 14 gün)      // təzəlik çəkisi
mastery  = 100 · (Σ w[düz] + 1.5) / (Σ w + 3)          // Bayes daralması, k = 3
```

- **Təzəlik çəkisi:** bir ay əvvəlki səhv bugünkü qədər ağır olmamalıdır.
- **Bayes daralması:** 2–3 cəhdə əsasən «12% mənimsəyib» demək yanlışdır; az
  datada nəticə 50%-ə tərəf çəkilir. Bu, kiçik nümunələrdə həm baseline-ı, həm
  final-ı eyni istiqamətdə sıxdığı üçün **fərqi şişirtmir**.
- **Çətinlik nəzərə alınmır:** `tasks`-da belə sahə yoxdur; empirik çətinlik az
  istifadəçidə səs-küylüdür. Pilotda da əlavə edilmir — düstur dəyişməz qalır.

Kod: `my_skill_mastery()` (migration 0047) və `lib/mastery.ts`.

> **Lazım olan dəyişiklik:** hazırkı funksiya BÜTÜN cəhdlər üzərində işləyir.
> Pilot üçün **pəncərəli** variant lazımdır (`from`, `to` parametrləri ilə).
> Xam jurnalda `created_at` olduğu üçün bu, geriyə dönük də hesablana bilir.

## 2. Zaman pəncərələri

| pəncərə | başlanğıc | son |
|---|---|---|
| Baseline | şagirdin 1-ci baseline sessiyası | 2-ci sessiyanın sonu |
| Müdaxilə | baseline sonu | final başlanğıcı |
| Final | 1-ci final sessiyası | 2-ci sessiyanın sonu |
| Saxlama (7 gün) | final sonu + 7 gün | + 1 gün |
| Saxlama (30 gün) | final sonu + 30 gün | + 1 gün |

Baseline və final mənimsəməsi **yalnız həmin pəncərənin cəhdləri** ilə hesablanır —
məşq cəhdləri qarışmır.

## 3. Hədəf və müqayisə bacarıqları

Şagird üçün baseline-da **zəif** sayılan bacarıq: ən azı 3 cəhd və mastery < 70
(`lib/mastery.ts` ilə eyni hədd).

Zəif bacarıqlar arasından mühərrik pilot rejimində **təsadüfi** 3-ünü hədəf götürür
(toxum = şagird ID). Qalanları müqayisə dəstidir.

```
hədəf     = randomSample(zəif_bacarıqlar, 3, seed = student_id)
müqayisə  = zəif_bacarıqlar \ hədəf
```

Şagirdin **hər iki dəstində ən azı 1 bacarıq** olmalıdır; olmayan şagird əsas
analizdən çıxarılır (səbəb hesabatda sayılır).

## 4. Əsas göstərici

Hər şagird üçün:

```
gain_hədəf    = mean(final_mastery − baseline_mastery)   // hədəf bacarıqlar üzrə
gain_müqayisə = mean(final_mastery − baseline_mastery)   // müqayisə bacarıqları üzrə
fərq          = gain_hədəf − gain_müqayisə
```

Kohort nəticəsi: `fərq` göstəricisinin şagirdlər üzrə **medianı** və orta qiyməti,
hər ikisi ayrıca. Median əsasdır — bir neçə şagirdin kəskin sıçrayışı ortanı əyə bilir.

**Sıfır fərziyyəsi:** `fərq = 0` (adaptiv hədəfləmə heç nə əlavə etmir).

Nümunə kiçik və paylanma naməlum olduğu üçün parametrik test işlədilmir.
İşarə testi (sign test) və ya Wilcoxon işarəli-dərəcə testi istifadə olunur;
əlavə olaraq `fərq` üçün bootstrap ilə 95% etibar aralığı verilir.

## 5. Yeni tapşırıqda transfer (novel-item)

«Yeni tapşırıq» = şagirdin `task_attempts`-də **heç vaxt görünməyən** `task_id`.
Praktikada bu, ayrılmış **F hovuzudur** (bax dizayn §6) — həmin tapşırıqlar məşqdə
göstərilmir.

```
novel_accuracy = düz cavab / ümumi,  yalnız F hovuzunun tapşırıqlarında
```

Hədəf və müqayisə bacarıqları üçün ayrıca hesablanır. Bu göstərici «uşaq cavabı
əzbərlədi» etirazına ən güclü cavabdır.

**Pozuntu yoxlaması:** analiz zamanı F hovuzundakı hər hansı tapşırıq final
pəncərəsindən ƏVVƏL cəhd olunubsa, həmin bacarıq həmin şagird üçün transfer
analizindən çıxarılır və hesabatda sayı göstərilir.

## 6. Çatışmayan data

| hal | qayda |
|---|---|
| Final testi verməyib | əsas analizdən çıxarılır, ITT sayımında qalır |
| Bir sessiyanı verib | tamamlanmamış sayılır |
| Bacarıqda final cəhdi 3-dən azdır | həmin bacarıq həmin şagird üçün atılır |
| Baseline-da zəif bacarığı yoxdur | «tavan effekti» kimi ayrıca sayılır |

Çatışmayan dəyər **sıfırla doldurulmur**. Sıfır «bilmir» deməkdir, «bilinmir»
deyil — bu ikisini qarışdırmaq qazancı süni artırır.

## 7. Əvvəlcədən elan olunmuş alt-analizlər

Yalnız bunlar. Yeni kəsimlər sonradan əlavə edilsə, hesabatda **kəşfiyyat
xarakterli** kimi işarələnir və əsas nəticə kimi təqdim edilmir.

1. Sinif üzrə (1, 2, 3, 4).
2. Baseline mənimsəməsinə görə: aşağı (<40), orta (40–69).
3. Fəallıq: aktiv gün sayı medianın altında / üstündə.

## 8. Reproduksiya

Bütün rəqəmlər `task_attempts` xam jurnalından yenidən hesablana bilməlidir.
Analiz skripti repoda saxlanılır; girişi yalnız pilot ID və tarixlərdir.
Hesabatdakı hər rəqəmin yanında onu verən sorğunun adı göstərilir.
