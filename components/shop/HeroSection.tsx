"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const lines = ["Nhẹ Nhàng.", "Thanh Lịch.", "Tự Do."];

export default function HeroSection() {
  return (
    <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600"
        alt="Fashion hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-espresso/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.35em] text-cream/70 mb-8"
        >
          Thời trang nữ cao cấp
        </motion.p>

        <div className="space-y-1 mb-10">
          {lines.map((line, i) => (
            <motion.h1
              key={line}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.2, ease: "easeOut" }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-light text-cream leading-tight tracking-wide"
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
            className="inline-block border border-cream text-cream text-xs uppercase tracking-[0.25em] px-10 py-4 hover:bg-cream hover:text-espresso transition-all duration-300"
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-cream/40 animate-pulse" />
      </motion.div>
    </div>
  );
}
