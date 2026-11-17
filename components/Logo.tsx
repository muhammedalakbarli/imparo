// "Imparo" loqosu — Zefi tülkünün rəsmi app-icon illüstrasiyası (şəffaf yuvarlaq PNG).
// Mənbə: public/logo.png (peşəkar render, künclər şəffaf).

// alt BOŞDUR (dekorativ): bütün istifadə yerlərində loqonun yanında "Imparo" mətni
// var — alt="Imparo" olanda ekran oxuyucuları və axtarış botları "Imparo Imparo" oxuyurdu.
// Loqo TƏK işlədilsə, `alt="Imparo"` ötür.
export default function Logo({ size = 56, alt = "" }: { size?: number; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      draggable={false}
    />
  );
}
