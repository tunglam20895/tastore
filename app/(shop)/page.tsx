import { Suspense } from "react";
import ProductGrid from "@/components/shop/ProductGrid";
import HeroSection from "@/components/shop/HeroSection";
import LoadingSpinner from "@/components/LoadingSpinner";

export const metadata = {
  title: "TRANG ANH STORE",
};

export default function HomePage() {
  return (
    <div>
      <HeroSection />

      <div id="san-pham" className="max-w-7xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-14 md:pb-20">
        {/* Section header */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-rose mb-3">New Arrivals</p>
          <h2 className="font-heading text-2xl md:text-3xl font-light text-espresso">Mới Về Hôm Nay</h2>
          <div className="w-16 h-px bg-blush mx-auto mt-5" />
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" label="Đang tải sản phẩm..." />
            </div>
          }
        >
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  );
}
