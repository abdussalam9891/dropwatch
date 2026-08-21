import { createClient } from "@/utils/supabase/server";
import { getProducts } from "./actions";
import AddProductForm from "@/components/AddProductForm";
import ProductCard from "@/components/ProductCard";
import { TrendingDown, Shield, Bell, Zap } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import Image from "next/image";

const FEATURES = [
  {
    icon: Zap,
    title: "Track in Seconds",
    description:
      "Paste a product URL and Dropwatch starts monitoring immediately — no setup, no waiting.",
  },
  {
    icon: Shield,
    title: "Works Where You Shop",
    description:
      "Built to handle JavaScript-heavy and dynamic product pages across major e-commerce sites.",
  },
  {
    icon: Bell,
    title: "Alerts That Actually Matter",
    description:
      "Set your target price once. Get notified the moment it drops — not hours later.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = user ? await getProducts() : [];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Image
            src="/dropwatch.svg"
            alt="Dropwatch"
            width={600}
            height={200}
            className="h-9 w-auto"
          />
          <AuthButton user={user} />
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-600 px-4 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-down">
            Free while in beta
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5 tracking-tight leading-tight animate-fade-up">
            Never Miss a{" "}
            <span className="text-orange-500">Price Drop</span>
          </h1>
          <p className="text-lg text-gray-500 mb-12 max-w-md mx-auto leading-relaxed animate-fade-up animation-delay-100">
            Add any product URL. We watch the price. You buy at the right time.
          </p>

          <div className="animate-fade-up animation-delay-200">
            <AddProductForm user={user} />
          </div>

          {/* Features — logged-out only */}
          {!user && (
            <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto mt-20">
              {FEATURES.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-xl hover:shadow-orange-100/60 hover:-translate-y-2 hover:border-orange-200
                    transition-all duration-300 ease-out
                    animate-fade-up"
                  style={{ animationDelay: `${(i + 3) * 100}ms` }}
                >
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center mb-5 mx-auto
                    group-hover:bg-orange-500 group-hover:scale-110 group-hover:rotate-[-4deg]
                    transition-all duration-300 ease-out">
                    <Icon className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      {user && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Tracked Products</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 items-start">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {user && products.length === 0 && (
        <section className="max-w-xl mx-auto px-6 pb-24 text-center">
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-14">
            <TrendingDown className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              No products tracked yet
            </h3>
            <p className="text-sm text-gray-400">
              Paste a product URL above to start watching prices.
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-50 py-6 text-center text-xs text-gray-300">
        Made with ❤️ by Abdus
      </footer>
    </main>
  );
}
