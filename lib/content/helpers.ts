// Məzmun üzərində saf (data-sız) köməkçilər.
//
// NİYƏ AYRI FAYL: `lib/content/index.ts` 25 fənn faylını statik import edir və onların
// qiymətləndirilməsi ~500 ms CPU tutur. Kimsə sadəcə bir köməkçi funksiya üçün index-dən
// import etsə, bütün məzmun bundle-a düşür və Cloudflare Worker soyuq başlanğıcda
// "Error 1102 — Worker exceeded resource limits" verir. Köməkçilər burada saxlanmalıdır.

// Reading-comprehension tapşırıqları dərsin oxu mətninə (passage) bağlıdır. Təsadüfi
// praktikada (qarışıq/sürət/gündəlik/səhvlər) mətn göstərilmədiyi üçün cavablana bilmir —
// ona görə bu tapşırıqlar praktika hovuzlarından çıxarılır (dərs içində normal işləyir).
// Dinləmə tapşırıqları isə öz `audioText`-ini daşıyır (öz-özünə tam) → praktikada qalır.
export function isPassageTask(task: { id: string }): boolean {
  return /-read-/.test(task.id);
}
