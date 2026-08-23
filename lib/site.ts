// Saytın kanonik ünvanı — TƏK MƏNBƏ.
//
// Niyə ayrıca fayl: bu dəyər üç yerdə işlədilir (metadataBase, robots.txt,
// sitemap.xml). Domen alınandan sonra üçü də köhnə `*.workers.dev` ünvanında
// qalmışdı — nəticədə Google kanonik ünvan kimi workers.dev-i görürdü və
// imparo.app ilə eyni məzmun iki domendə indeksləşirdi (duplicate content,
// reytinq bölünməsi). Bir daha ayrılmasın deyə buradan idxal olunur.
export const SITE_URL = "https://imparo.app";
export const SITE_HOST = "imparo.app";

// Köhnə ünvanlar — hələ də Worker-ə bağlıdır, ona görə kanonik hosta yönləndirilir.
export const LEGACY_HOSTS = ["www.imparo.app", "imparo.m-alakbarli2007.workers.dev"];
