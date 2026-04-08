"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

/**
 * FlyToCartAnimation
 * - Dot (ảnh sản phẩm hoặc circle) bay theo đường cong parabolic từ vị trí click → icon giỏ hàng
 * - Badge flash effect khi dot "đáp" vào giỏ
 */

export default function FlyToCartAnimation() {
  const { flyTrigger, flyDone } = useCart();
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (flyTrigger) {
      setArrived(false);
    }
  }, [flyTrigger]);

  if (!flyTrigger) return null;

  const { startX, startY, imageUrl, id } = flyTrigger;

  // Vị trí giỏ hàng (tìm theo data attribute)
  const bagEl = document.querySelector("[data-bag-icon]") as HTMLElement | null;
  if (!bagEl) {
    // fallback: góc phải trên
    flyDone();
    return null;
  }
  const rect = bagEl.getBoundingClientRect();
  const endX = rect.left + rect.width / 2;
  const endY = rect.top + rect.height / 2;

  const duration = 0.65;

  return (
    <>
      <motion.div
        key={id}
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: startX - 20,
          top: startY - 20,
          width: 40,
          height: 40,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        <motion.div
          className="w-full h-full rounded-full overflow-hidden border-2 border-blush/60 shadow-xl"
          style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "var(--color-espresso, #1A0A04)" }}
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            x: endX - startX,
            y: endY - startY,
            scale: [1, 1.2, 0.15],
            rotate: [0, 15, -10, 5],
          }}
          transition={{
            x: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            y: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            scale: {
              duration,
              times: [0, 0.4, 1],
              ease: "easeInOut",
            },
            rotate: { duration, ease: "easeInOut" },
          }}
          onAnimationComplete={() => {
            setArrived(true);
          }}
        />
      </motion.div>

      {/* Flash effect khi dot chạm giỏ */}
      <AnimatePresence>
        {arrived && (
          <motion.span
            className="fixed pointer-events-none z-[9998]"
            style={{
              left: endX - 12,
              top: endY - 12,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--color-espresso, #1A0A04)",
            }}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onAnimationComplete={() => {
              setTimeout(() => flyDone(), 50);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
