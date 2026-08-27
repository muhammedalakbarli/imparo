# İmparo pilotu — ölçmə dizaynı

> **Status:** layihə. Pilot başlayana qədər dəyişdirilə bilər.
> Pilot başladıqdan sonra bu sənəd **dondurulur** (bax «Data freeze»).

## 1. Tədqiqat sualı

> İmparonun adaptiv öyrənmə mühərriki şagirdin konkret bacarıqlar üzrə
> mənimsəməsini artırırmı — və bu artım şagirdin **əvvəl görmədiyi** tapşırıqlara
> keçirmi?

İkinci hissə vacibdir. Onsuz nəticə «uşaq gördüyü sualın cavabını yadda saxladı»
etirazına açıq qalır.

## 2. Nəyi ölçmürük

Bunlar **əsas nəticə deyil** və hesabatda dəstək göstəricisi kimi verilir:

- həll edilən tapşırıq sayı, XP, streak, sessiya sayı;
- dərs tamamlama faizi;
- **eyni tapşırıqda** səhvin təkrarlanması.

Sonuncu xüsusilə diqqətlidir: SRS səhv edilən tapşırığı **qəsdən** geri gətirir,
adaptiv mühərrik isə zəif bacarığı daha tez-tez göstərir. Yəni bu göstərici
öyrənmədən deyil, sistemin mexanikasından dəyişir. Ölçü kimi işlədilməsi
öz-özünü doğruldan nəticə verər.

## 3. İştirakçılar

- **Sinif:** 1–4
- **Fənn:** Riyaziyyat (izahlar və bacarıq etiketləri yalnız burada tamdır)
- **Müddət:** 4–8 həftə
- **Hədəf:** ən azı 100 şagird **final testi tamamlayan**

Qeydiyyat hədəfi bunun **iki qatı** olmalıdır. Səbəb: öz retensiya
araşdırmamıza görə şagirdlərin təxminən yarısı ilk ay ərzində fəaliyyəti
dayandırır. 200 qeydiyyat → ~100 final gözləntisi realdır.

**Daxil olma:** 1–4-cü sinif, baseline-ın hər iki sessiyasını tamamlayıb.
**Kənarlaşdırma:** baseline yarımçıqdır; hesabda müəllim/admin rolu var; bot hesabı.

## 4. Prioritet bacarıqlar

Vahid 12 bacarıqlıq dəst 1–4-cü sinifə **xidmət edə bilməz**: 1-ci sinif şagirdini
vurma cədvəlində ölçmək mənasızdır. Ona görə dəst **sinifə bantlıdır**. Əsas
nəticə (qazanc) şagirdin öz daxilindəki fərq olduğu üçün siniflər arası
birləşdirilə bilir.

**Seçim meyarı — məzmundan yoxlanıb:**

1. bacarıqda ən azı **12 tapşırıq** olsun (3 baseline + 3 final ayrılır, ən azı 6-sı
   məşq üçün qalır);
2. qrafda prereq əlaqəsi aydın olsun;
3. həmin sinifdə real keçilsin;
4. etiketləmə əl ilə yoxlanılsın.

### 1-ci sinif (7 bacarıq)
`number.count` · `number.compare` · `arith.add.basic` · `arith.sub.basic` ·
`geom.shapes` · `measure.time` · `problem.one_step`

### 2-ci sinif (10 bacarıq)
`number.place_value` · `arith.add.no_carry` · `arith.add.carry` ·
`arith.sub.no_borrow` · `arith.sub.borrow` · `arith.mul.concept` ·
`arith.mul.tables` · `arith.div.concept` · `arith.div.tables` · `problem.one_step`

### 3-cü sinif (9 bacarıq)
`arith.add.carry` · `arith.sub.borrow` · `arith.mul.tables` · `arith.div.tables` ·
`arith.div.remainder` · `fraction.concept` · `fraction.compare` ·
`geom.perimeter` · `problem.one_step`

### 4-cü sinif (10 bacarıq)
`arith.mul.tables` · `arith.mul.multi_digit` · `arith.div.multi_digit` ·
`arith.order_of_ops` · `number.rounding` · `fraction.add_sub_same` ·
`decimal.add_sub` · `geom.area` · `measure.convert` · `problem.one_step`

### Ölçülə bilməyən bacarıqlar

Aşağıdakılarda tapşırıq sayı 12-dən azdır, yəni **baseline + final + məşq** üçün
material çatmır. Pilotdan kənardır; məzmun yazılana qədər heç bir qiymətləndirmədə
işlədilməməlidir:

`decimal.compare` (1) · `measure.units` (2) · `decimal.mul_div` (2) ·
`fraction.simplify` (4) · `decimal.concept` (7) · `fraction.equivalent` (7) ·
`fraction.of_quantity` (8) · `number.sequence` (9) · `problem.multi_step` (11)

### Yoxlamada düşən iki bacarıq

Seçim məzmuna qarşı yoxlanıldı (şagirdin sinfinə qədər olan tapşırıqlar sayıldı) və
iki bacarıq **3 + 3 + ≥6 bölgüsünü ödəmədi** — ona görə pilotdan çıxarıldı:

- **1-ci sinif `number.place_value` — 10 tapşırıq.** 1-ci sinifdə mərtəbə mövzusu
  yalnız 11–20 ayrılışında toxunulur. (2-ci sinifdə 22 tapşırıq var, orada qalır.)
- **3-cü sinif `geom.area` — 10 tapşırıq.** Sahə 3-cü sinifdə keçilir, amma
  material çatmır. (4-cü sinifdə 21 tapşırıq var, orada qalır.)

Hər ikisi **məzmun boşluğudur**: mövzu kurikulumdadır, tapşırıq azdır.

### Sərhəddə olan bacarıqlar

Aşağıdakılarda ayırmadan sonra məşqə cəmi **8–9 tapşırıq** qalır. Daxil edilir,
amma hesabatda qeyd olunur — 8 həftəlik məşq üçün material azdır və effekt
görünməyə bilər:

`arith.div.remainder` (3-cü sinif, 14) · `fraction.concept` (3-cü sinif, 14) ·
`fraction.compare` (3-cü sinif, 15)

## 5. Baseline

- **Quruluş:** bacarıq başına **3 tapşırıq**.
- **Həcm:** 1-ci sinif 21 sual, 3-cü sinif 27, 2 və 4-cü sinif 30 sual.
- **Bölgü:** iki sessiya (hər biri 10–15 sual), ən çox 3 gün ara ilə.
- **Rejim:** cavab və izah göstərilmir (`PracticeRunner` `silent`). Test öyrətməməlidir.
- **Vaxt limiti yoxdur.**

Niyə 3 sual: bir sual təsadüfü ayırd etmir, 5 sual isə 10 bacarıqda 50 suala
çıxır — 2-ci sinif şagirdi onu dürüst həll etmir. Yorğunluqdan gələn səhv
baseline-ı süni aşağı salar, sonrakı «artım» isə şişər. Bu, datasızlıqdan pisdir.

## 6. Final test

- Baseline ilə **eyni bacarıqlar**, **eyni say** (3 tapşırıq).
- **Tapşırıqlar başqadır** və şagird onları pilot boyu **heç vaxt görməyib**
  (bax «Ayrılmış hovuz»).
- Eyni rejim: izahsız, vaxt limitsiz, iki sessiya.

### Ayrılmış hovuz (held-out) — texniki tələb

Final testin tapşırıqları məşq hovuzlarına **düşməməlidir**. Əks halda «əvvəl
görmədiyi tapşırıq» iddiası yalan olur. Hər bacarıq üçün tapşırıqlar üç yerə
bölünür və bu bölgü pilot boyu **sabit qalır**:

| hissə | təyinat |
|---|---|
| B (3 tapşırıq) | yalnız baseline |
| F (3 tapşırıq) | yalnız final — məşqdə **heç vaxt** göstərilmir |
| P (qalan) | məşq, adaptiv seçim, SRS |

## 7. Əsas müqayisə: uşağın öz daxilində

A/B bölgüsü seçilmədi. Səbəb: məktəb təsadüfi şagird yox, hazır sinif verir —
randomizasiya onsuz da alınmayacaq; 100 şagirdi ikiyə bölmək qolları 50-yə endirir;
üstəlik uşaqların yarısından işləyən məhsulu əsirgəmək düzgün deyil.

Əvəzinə hər şagirdin **öz daxilində** iki dəst müqayisə edilir:

- **Hədəf bacarıqlar** — baseline-da zəif çıxan və mühərrikin məşq etdirdiyi;
- **Müqayisə bacarıqları** — baseline-da **eyni dərəcədə zəif** çıxan, amma
  mühərrikin bu dövrdə hədəfə almadığı.

### Kritik problem və həlli

Mühərrik hazırda **ən zəif** 3 bacarığı hədəf götürür (`targetSkills`). Yəni hədəf
dəsti müqayisə dəstindən sistematik olaraq **daha zəifdir** — ortaya qayıdış
effekti (regression to the mean) təkbaşına «hədəf qrupda daha çox artım» yaradar.
Bu, nəticəni etibarsız edər.

**Həll:** pilot iştirakçılarında mühərrik zəif bacarıqlar arasından hədəfi
**təsadüfi** seçsin (ən zəifdən deyil). Bu, kiçik kod dəyişikliyidir və müqayisəni
uşağın daxilində **randomizasiya olunmuş** eksperimentə çevirir — heç kimdən heç nə
əsirgəmədən, çünki qalan zəif bacarıqlar da növbə ilə hədəfə düşür.

Randomizasiya toxumu (seed) şagird ID-sindən çıxarılır ki, nəticə təkrar
hesablana bilsin.

## 8. Göstəricilər

**Əsas (primary):**

> Hədəf bacarıqlarda **final − baseline** mənimsəmə fərqi, müqayisə
> bacarıqlarındakı eyni fərqlə qarşılaşdırılmış.

**İkinci dərəcəli:**

1. Yeni tapşırıqda dəqiqlik (novel-item transfer) — hədəf vs müqayisə.
2. Bacarıq üzrə mənimsəmənin dəyişməsi (bacarıq-bacarıq siyahı).
3. 7 və 30 günlük saxlama (final testdən sonra təkrar ölçmə).

**Dəstək (nəticə deyil):** aktiv gün, sessiya sayı, tamamlanan dərs, streak.

## 9. İtki (attrition)

Hesabatda **hər iki rəqəm** verilir:

- **Qeydiyyatdan keçən hamı** (intention-to-treat) — final testi verməyənlər
  daxil, onların qazancı **0 sayılmır**, «məlum deyil» kimi göstərilir;
- **Tamamlayanlar** (completers).

Nəticə heç vaxt yalnız tamamlayanlar üzərindən bütün kohorta aid edilmir.
Tamamlama faizi hesabatın **birinci səhifəsində** verilir.

## 10. Data freeze

Pilot başladığı gündən sonra dəyişdirilmir:

- tədqiqat sualı,
- prioritet bacarıq siyahıları,
- baseline/final quruluşu və ayrılmış hovuz,
- əsas göstərici və onun düsturu,
- itki ilə davranış qaydası.

Ciddi texniki problem çıxarsa dəyişiklik **versiyalanır**: bu sənədə tarix, səbəb
və təsir yazılır. Sonradan «hansı nəticə yaxşı çıxdısa onu əsas göstərici elan
etmək» qarşısını alan yeganə mexanizm budur.
