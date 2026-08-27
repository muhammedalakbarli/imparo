// "Imparo" loqosu — Zefi tülkünün rəsmi app-icon illüstrasiyası (şəffaf yuvarlaq PNG).
// Mənbə: public/logo.png (peşəkar render, künclər şəffaf).

export default function Logo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Imparo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      draggable={false}
    />
  );
}
