-- İngilis dili: «Dinləmə və danışıq» bölməsi — Supabase SQL Editor-da işə salın.
-- Yalnız bu bölməni əlavə/yeniləyir; digər məzmuna toxunmur.
begin;

insert into units (id, subject_id, title, description, sort_order) values
  ('en-listen-speak', 'ingilis-dili', 'Dinləmə və danışıq', 'İngiliscəni qulaqla tanı və sözlərdən düzgün cümlə qur — dinlə-seç və cümlə quran məşqləri.', 4)
on conflict (id) do update set subject_id = excluded.subject_id, title = excluded.title, description = excluded.description, sort_order = excluded.sort_order;

insert into lessons (id, unit_id, title, intro, visual, sections, sort_order) values
  ('en-lsn-l1', 'en-listen-speak', 'Dinlə və seç: sözlər', 'İngilis sözünü dinlə, düzgün mənasını seç.', null, '[{"heading":"Necə işləyir?","body":"«Dinlə» düyməsinə bas, sözü eşit və mənasını seç. İstədiyin qədər təkrar dinləyə bilərsən."},{"heading":"Məsləhət","body":"Sözü öz-özünə səssiz təkrarla — belə tələffüz daha yaxşı yadda qalır."}]'::jsonb, 0),
  ('en-wor-l1', 'en-listen-speak', 'Cümlə qur: sadə cümlələr', 'Qarışıq sözləri düzgün sıraya düz və İngilis cümləsini qur.', null, '[{"heading":"Necə işləyir?","body":"Aşağıdakı sözlərə sıra ilə bas — onlar yuxarıda cümləni düzəldəcək. Səhv seçsən, sözə basıb geri götür."},{"heading":"Məsləhət","body":"İngilis cümləsi adətən belədir: kim → nə edir → nəyi. Azərbaycanca tərcümə ipucu kimi verilir."}]'::jsonb, 1)
on conflict (id) do update set unit_id = excluded.unit_id, title = excluded.title, intro = excluded.intro, visual = excluded.visual, sections = excluded.sections, sort_order = excluded.sort_order;

insert into tasks (id, lesson_id, type, prompt, data, xp, sort_order) values
  ('en-lsn-t1', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"apple","options":["kitab","alma","su","it"],"correctIndex":1}'::jsonb, 10, 0),
  ('en-lsn-t2', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"book","options":["kitab","ev","süd","quş"],"correctIndex":0}'::jsonb, 10, 1),
  ('en-lsn-t3', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"water","options":["ağac","əl","su","gecə"],"correctIndex":2}'::jsonb, 10, 2),
  ('en-lsn-t4', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"house","options":["ev","məktəb","dost","günəş"],"correctIndex":0}'::jsonb, 10, 3),
  ('en-lsn-t5', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"dog","options":["pişik","quş","it","at"],"correctIndex":2}'::jsonb, 10, 4),
  ('en-lsn-t6', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"cat","options":["pişik","it","siçan","quş"],"correctIndex":0}'::jsonb, 10, 5),
  ('en-lsn-t7', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"school","options":["ailə","məktəb","şəhər","otaq"],"correctIndex":1}'::jsonb, 10, 6),
  ('en-lsn-t8', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"friend","options":["düşmən","qonşu","dost","müəllim"],"correctIndex":2}'::jsonb, 10, 7),
  ('en-lsn-t9', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"family","options":["ailə","sinif","komanda","dost"],"correctIndex":0}'::jsonb, 10, 8),
  ('en-lsn-t10', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"teacher","options":["şagird","müəllim","həkim","sürücü"],"correctIndex":1}'::jsonb, 10, 9),
  ('en-lsn-t11', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"morning","options":["gecə","axşam","səhər","günorta"],"correctIndex":2}'::jsonb, 10, 10),
  ('en-lsn-t12', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"night","options":["gecə","gün","səhər","axşam"],"correctIndex":0}'::jsonb, 10, 11),
  ('en-lsn-t13', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"happy","options":["kədərli","xoşbəxt","yorğun","ac"],"correctIndex":1}'::jsonb, 10, 12),
  ('en-lsn-t14', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"food","options":["su","hava","yemək","işıq"],"correctIndex":2}'::jsonb, 10, 13),
  ('en-lsn-t15', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"audioText":"sun","options":["günəş","ay","ulduz","bulud"],"correctIndex":0}'::jsonb, 15, 14),
  ('en-lsn-b1', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"bonus":true,"audioText":"milk","options":["su","süd","çay","şirə"],"correctIndex":1}'::jsonb, 15, 15),
  ('en-lsn-b2', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"bonus":true,"audioText":"tree","options":["gül","ot","ağac","yarpaq"],"correctIndex":2}'::jsonb, 15, 16),
  ('en-lsn-b3', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"bonus":true,"audioText":"bird","options":["balıq","quş","arı","kəpənək"],"correctIndex":1}'::jsonb, 15, 17),
  ('en-lsn-b4', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"bonus":true,"audioText":"red","options":["mavi","yaşıl","qırmızı","sarı"],"correctIndex":2}'::jsonb, 15, 18),
  ('en-lsn-b5', 'en-lsn-l1', 'listening', 'Dinlə və eşitdiyin sözün mənasını seç.', '{"bonus":true,"audioText":"big","options":["kiçik","böyük","uzun","qısa"],"correctIndex":1}'::jsonb, 15, 19),
  ('en-wor-t1', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["I","am","happy"],"answer":"I am happy","translation":"Mən xoşbəxtəm."}'::jsonb, 10, 0),
  ('en-wor-t2', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["She","is","my","friend"],"answer":"She is my friend","translation":"O mənim dostumdur."}'::jsonb, 10, 1),
  ('en-wor-t3', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["The","cat","is","black"],"answer":"The cat is black","translation":"Pişik qaradır."}'::jsonb, 10, 2),
  ('en-wor-t4', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["We","go","to","school"],"answer":"We go to school","translation":"Biz məktəbə gedirik."}'::jsonb, 10, 3),
  ('en-wor-t5', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["He","likes","apples"],"answer":"He likes apples","translation":"O almanı sevir."}'::jsonb, 10, 4),
  ('en-wor-t6', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["This","is","my","book"],"answer":"This is my book","translation":"Bu mənim kitabımdır."}'::jsonb, 10, 5),
  ('en-wor-t7', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["They","play","football"],"answer":"They play football","translation":"Onlar futbol oynayır."}'::jsonb, 10, 6),
  ('en-wor-t8', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["The","sun","is","hot"],"answer":"The sun is hot","translation":"Günəş istidir."}'::jsonb, 10, 7),
  ('en-wor-t9', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["I","have","a","dog"],"answer":"I have a dog","translation":"Mənim itim var."}'::jsonb, 10, 8),
  ('en-wor-t10', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["My","mother","is","a","teacher"],"answer":"My mother is a teacher","translation":"Anam müəllimdir."}'::jsonb, 10, 9),
  ('en-wor-t11', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["We","are","good","friends"],"answer":"We are good friends","translation":"Biz yaxşı dostlarıq."}'::jsonb, 10, 10),
  ('en-wor-t12', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["The","bird","can","fly"],"answer":"The bird can fly","translation":"Quş uça bilər."}'::jsonb, 10, 11),
  ('en-wor-t13', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["I","drink","milk"],"answer":"I drink milk","translation":"Mən süd içirəm."}'::jsonb, 10, 12),
  ('en-wor-t14', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["She","reads","a","book"],"answer":"She reads a book","translation":"O kitab oxuyur."}'::jsonb, 10, 13),
  ('en-wor-t15', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"words":["It","is","a","big","house"],"answer":"It is a big house","translation":"Bu böyük evdir."}'::jsonb, 15, 14),
  ('en-wor-b1', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"bonus":true,"words":["Do","you","like","music"],"answer":"Do you like music","translation":"Sən musiqini sevirsən?"}'::jsonb, 15, 15),
  ('en-wor-b2', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"bonus":true,"words":["He","is","not","at","home"],"answer":"He is not at home","translation":"O evdə deyil."}'::jsonb, 15, 16),
  ('en-wor-b3', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"bonus":true,"words":["We","watch","TV","every","day"],"answer":"We watch TV every day","translation":"Biz hər gün televizora baxırıq."}'::jsonb, 15, 17),
  ('en-wor-b4', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"bonus":true,"words":["My","father","works","every","day"],"answer":"My father works every day","translation":"Atam hər gün işləyir."}'::jsonb, 15, 18),
  ('en-wor-b5', 'en-wor-l1', 'word_order', 'Sözləri düzgün sıraya düz.', '{"bonus":true,"words":["The","children","are","playing"],"answer":"The children are playing","translation":"Uşaqlar oynayır."}'::jsonb, 15, 19)
on conflict (id) do update set lesson_id = excluded.lesson_id, type = excluded.type, prompt = excluded.prompt, data = excluded.data, xp = excluded.xp, sort_order = excluded.sort_order;

commit;
