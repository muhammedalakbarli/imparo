// Monoxrom palitra: bütün fənlər eyni indigo vurğunu paylaşır,
// fərqləndirmə ikon və başlıqla olur.

export interface ColorClasses {
  bg: string; // dolğun indigo
  bgSoft: string; // yumşaq panel
  text: string; // indigo mətn
  border: string; // kənar
  ring: string;
}

const brand: ColorClasses = {
  bg: "bg-brand",
  bgSoft: "bg-panel-2",
  text: "text-brand",
  border: "border-line",
  ring: "ring-brand",
};

export function colorClasses(_color?: string): ColorClasses {
  return brand;
}
