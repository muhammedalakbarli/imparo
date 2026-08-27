-- İngilis dili path yenidən quruluşu (Qrammatika→Vocabulary→Listening→Reading→Writing).
-- Bölmələr yenilənir/əlavə olunur; dərslər yalnız köçürülür (mətn/tapşırıq toxunulmur).
begin;

insert into units (id, subject_id, title, description, sort_order) values
  ('en-grammar', 'ingilis-dili', 'Qrammatika — Zamanlar və cümlə', 'Present Simple, Present Continuous, Past Simple, sual/inkar cümlələr, əvəzliklər, artikllar, sifət dərəcələri və modal fellər.', 0),
  ('en-nouns', 'ingilis-dili', 'İsimlər (Nouns)', 'İsim nədir, cəm forması, sayıla bilən və sayıla bilməyən isimlər.', 1),
  ('en-vocab', 'ingilis-dili', 'Söz ehtiyatı (Vocabulary)', 'Gündəlik həyatla bağlı mövzular: ailə, məktəb, təbiət, qida, şəhər və hobbilər.', 2),
  ('en-listen-speak', 'ingilis-dili', 'Dinləmə (Listening)', 'İngiliscəni qulaqla tanı: salamlaşma, sual-cavab və gündəlik ifadələr.', 3),
  ('en-reading', 'ingilis-dili', 'Oxu (Reading)', 'Qısa mətnləri oxuyub başa düş və suallara cavab ver.', 4),
  ('en-skills', 'ingilis-dili', 'Yazı (Writing)', 'Böyük hərf, durğu işarələri və düzgün cümlə quruluşu ilə yaz.', 5)
on conflict (id) do update set subject_id = excluded.subject_id, title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into lessons (id, unit_id, title, sort_order) values
  ('en-gr-l1', 'en-grammar', 'Present Simple (İndiki sadə zaman)', 0),
  ('en-gr-l2', 'en-grammar', 'Present Continuous (İndiki davamedici zaman)', 1),
  ('en-gr-l3', 'en-grammar', 'Past Simple (Keçmiş sadə zaman)', 2),
  ('en-gr-l4', 'en-grammar', 'Sual və inkar cümlələr (Questions & negatives)', 3),
  ('en-gr-l5', 'en-grammar', 'Əvəzliklər (Pronouns)', 4),
  ('en-gr-l6', 'en-grammar', 'Artikllar (a / an / the)', 5),
  ('en-gr-l7', 'en-grammar', 'Sifətin dərəcələri (Comparative & superlative)', 6),
  ('en-gr-l8', 'en-grammar', 'Modal fellər (can / must / should)', 7),
  ('en-noun-1', 'en-nouns', 'Noun nədir? (What is a noun)', 0),
  ('en-noun-2', 'en-nouns', 'Nounun cəm forması (Plural nouns)', 1),
  ('en-noun-3', 'en-nouns', 'Countable & Uncountable nouns', 2),
  ('en-vo-l1', 'en-vocab', 'Ailə və dostlar (Family and friends)', 0),
  ('en-vo-l2', 'en-vocab', 'Məktəb həyatı (School life)', 1),
  ('en-vo-l3', 'en-vocab', 'Təbiət və heyvanlar (Nature and animals)', 2),
  ('en-vo-l4', 'en-vocab', 'Qida və sağlamlıq (Food and health)', 3),
  ('en-vo-l5', 'en-vocab', 'Şəhər, məkanlar və ev (City, places, home)', 4),
  ('en-vo-l6', 'en-vocab', 'Hobbilər və gündəlik işlər (Hobbies & daily routines)', 5),
  ('en-lsn-l1', 'en-listen-speak', 'Dinlə və seç: sözlər', 0),
  ('en-sk-l2', 'en-listen-speak', 'Dinləmə (Listening)', 1),
  ('en-sk-l3', 'en-listen-speak', 'Danışma (Speaking)', 2),
  ('en-sk-l1', 'en-reading', 'Oxu (Reading)', 0),
  ('en-wor-l1', 'en-skills', 'Cümlə qur: sadə cümlələr', 0),
  ('en-sk-l4', 'en-skills', 'Yazı (Writing)', 1)
on conflict (id) do update set unit_id = excluded.unit_id, sort_order = excluded.sort_order;

commit;
