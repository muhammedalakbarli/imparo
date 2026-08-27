"use client";

// Zefi-nin danışıq balonu (Duolingo xarakter balonu hissi).
// tail: balonun ucunun hansı tərəfə baxdığı (mascota doğru).

import { motion } from "framer-motion";

export default function SpeechBubble({
  children,
  tail = "left",
  className = "",
}: {
  children: React.ReactNode;
  tail?: "left" | "bottom";
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className={`relative rounded-2xl border-2 border-line bg-panel px-4 py-3 text-fg shadow-[0_4px_0_0_var(--color-line)] ${className}`}
    >
      {children}
      {tail === "left" && (
        <span className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-panel" />
      )}
      {tail === "bottom" && (
        <span className="absolute bottom-0 left-8 h-4 w-4 translate-y-1/2 rotate-45 border-b-2 border-r-2 border-line bg-panel" />
      )}
    </motion.div>
  );
}
