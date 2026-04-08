"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const lines = ["Nhẹ Nhàng.", "Thanh Lịch.", "Tự Do."];

export default function HeroSection() {
  return (
    <div className="relative h-[100dvh] min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero.jpg"
        alt="Fashion hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-espresso/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-cream/70 mb-6 md:mb-8"
        >
          Thời trang nữ cao cấp
        </motion.p>

        <div className="space-y-0.5 md:space-y-1 mb-8 md:mb-10">
          {lines.map((line, i) => (
            <motion.h1
              key={line}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.2, ease: "easeOut" }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-cream/70 leading-tight tracking-wide"
            >
              {line}
            </motion.h1>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="#san-pham"
            className="inline-block bg-white/20 backdrop-blur-sm border border-white/40 text-espresso text-xs uppercase tracking-[0.25em] px-8 py-3 md:px-10 md:py-4 hover:bg-cream hover:text-espresso hover:border-cream transition-all duration-300"
          >
            Khám Phá Ngay
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-10 md:h-12 bg-cream/40 animate-pulse" />
      </motion.div>
    </div>
  );
}
