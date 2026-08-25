# İmparo — Öyrənmə Təsiri Hesabatı (şablon)

> Rəqəmlər **qəsdən boşdur**. Şablon pilot başlamazdan əvvəl commit olunub ki,
> nəticə göründükdən sonra «hansı göstərici yaxşı çıxdısa onu əsas elan etmək»
> mümkün olmasın.
>
> Metodologiya: [`measurement-design.md`](./measurement-design.md) ·
> [`analysis-plan.md`](./analysis-plan.md)

## Xülasə

| | |
|---|---|
| Pilot dövrü | ___ – ___ |
| Fənn / siniflər | Riyaziyyat · 1–4 |
| Qeydiyyat | ___ |
| Baseline tamamlayan | ___ |
| **Final tamamlayan** | **___** |
| **Tamamlama faizi** | **___%** |

> Tamamlama faizi birinci verilir. Nəticələr yalnız tamamlayanlara aiddir və
> bütün kohorta şamil edilmir.

## Əsas nəticə

Hədəf bacarıqlardakı qazancın müqayisə bacarıqlarındakı qazancdan fərqi:

| | median | orta | 95% EA |
|---|---|---|---|
| Hədəf bacarıqlar (faiz bəndi) | ___ | ___ | ___ |
| Müqayisə bacarıqları (faiz bəndi) | ___ | ___ | ___ |
| **Fərq** | **___** | **___** | **___** |

Sign test / Wilcoxon: p = ___ · analizə daxil olan şagird: ___

## Yeni tapşırıqda transfer

Şagirdin pilot boyu heç vaxt görmədiyi tapşırıqlarda dəqiqlik:

| | baseline | final | fərq |
|---|---|---|---|
| Hədəf bacarıqlar | ___% | ___% | ___ |
| Müqayisə bacarıqları | ___% | ___% | ___ |

Pozuntuya görə çıxarılan hal: ___

## Bacarıq üzrə

| bacarıq | sinif | şagird | baseline | məşq | final | fərq |
|---|---|---|---|---|---|---|
| ___ | ___ | ___ | ___% | ___ | ___% | ___ |

«məşq» = müdaxilə dövründə şagird başına orta tapşırıq sayı (B və F hovuzları
sayılmır). Bu sütun olmadan nəticənin arxasında real müdaxilə olub-olmadığı
bilinmir: 2 tapşırıq həll edilmiş bacarığın «qazancını» 30 tapşırıq həll
edilmişlə eyni oxumaq olmaz.

## Saxlama

| | 7 gün | 30 gün |
|---|---|---|
| Hədəf bacarıqlarda mənimsəmə | ___% | ___% |
| Finala görə dəyişmə | ___ | ___ |

## Alt-analizlər (əvvəlcədən elan olunmuş)

| kəsim | n | fərq (median) |
|---|---|---|
| 1-ci sinif | ___ | ___ |
| 2-ci sinif | ___ | ___ |
| 3-cü sinif | ___ | ___ |
| 4-cü sinif | ___ | ___ |
| Baseline < 40 | ___ | ___ |
| Baseline 40–69 | ___ | ___ |
| Fəallıq: median altı | ___ | ___ |
| Fəallıq: median üstü | ___ | ___ |

## Dəstək göstəriciləri (nəticə deyil)

| | |
|---|---|
| Orta aktiv gün | ___ |
| Orta sessiya | ___ |
| Tamamlanan dərs | ___ |
| Həll edilən tapşırıq | ___ |

## Məhdudiyyətlər

Bu bölmə **boş buraxıla bilməz**. Ən azı aşağıdakılar yazılmalıdır:

- nəzarət qrupu yoxdur; müqayisə şagirdin öz daxilindədir;
- iştirakçılar təsadüfi seçilməyib (məktəb/mərkəz vasitəsilə gəliblər);
- tamamlayanlar daha fəal şagirdlərdir (seçim təsiri);
- nümunə həcmi ___;
- üç bacarıqda məşq materialı sərhəddədir (`arith.div.remainder`,
  `fraction.concept`, `fraction.compare` — məşqə 8–9 tapşırıq qalır);
- ölçmə yalnız riyaziyyata aiddir, digər fənlərə şamil edilmir.

## Dəyişiklik jurnalı

| tarix | dəyişiklik | səbəb |
|---|---|---|
| 2026-08-25 | `task_attempts.source` sahəsi əlavə olundu (migration 0051) | Ölçmə jurnalı natamam idi: praktikadan gələn bütün cəhdlər `lesson_id = 'practice'` kimi yazılırdı, yəni diaqnostika / adaptiv məşq / SRS bir-birindən ayırd edilmirdi. Müdaxilə, baseline/final, randomizasiya və əsas göstərici **dəyişmədi** — yalnız qeyd olunan məlumat zənginləşdi. Pilotda hələ 0 iştirakçı olduğu üçün heç bir data korlanmadı. |
| ___ | ___ | ___ |
