











"use client";

import { useState } from "react";
import { deleteProduct } from "@/app/actions";
import PriceChart from "./PriceChart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Trash2,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types/supabase";

const CURRENCY_MAP: Record<string, string> = {
  "₹": "INR",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

const formatPrice = (price: string, currency = "INR"): string => {
  const code = CURRENCY_MAP[currency] ?? currency;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(parseFloat(price));
};

const getPriceDrop = (current: number, original: number | null): string | null => {
  if (!original || !current) return null;
  const drop = ((original - current) / original) * 100;
  return drop > 0 ? drop.toFixed(1) : null;
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteProduct(product.id);
  };

  const priceDrop = getPriceDrop(
    parseFloat(product.current_price),
    product.original_price !== null ? parseFloat(product.original_price) : null,
  );

  return (
    <Card
      className="group overflow-hidden border-gray-100 shadow-sm
        hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1
        transition-all duration-300 ease-out"
    >
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {/* Product image */}
          <div className="w-20 h-20 rounded-xl border border-gray-100 overflow-hidden
            bg-gray-50 shrink-0 flex items-center justify-center">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover
                  group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <TrendingDown className="w-8 h-8 text-gray-200" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-orange-500 tracking-tight">
                {formatPrice(product.current_price, product.currency)}
              </span>

              {priceDrop && (
                <Badge className="bg-emerald-50 text-emerald-600 border-0
                  gap-1 font-medium text-xs">
                  <TrendingDown className="w-3 h-3" />
                  {priceDrop}% off
                </Badge>
              )}

              {!priceDrop && (
                <Badge variant="secondary" className="text-xs font-normal text-gray-400">
                  Watching
                </Badge>
              )}
            </div>

            {product.original_price && (
              <p className="text-xs text-gray-400 mt-1">
                was{" "}
                <span className="line-through">
                  {formatPrice(product.original_price, product.currency)}
                </span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Inline delete confirm */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl
            border border-red-100 animate-fade-up">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-600 flex-1">Remove from tracking?</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 px-3 text-xs bg-red-500 hover:bg-red-600
                text-white border-0 gap-1"
            >
              {deleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChart(!showChart)}
              className="gap-1.5 text-xs border-gray-200 hover:border-orange-200
                hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
            >
              {showChart ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {showChart ? "Hide chart" : "Price history"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs border-gray-200 hover:border-gray-300
                transition-all duration-200"
            >
              <Link href={product.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                View product
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="gap-1.5 text-xs text-gray-400 hover:text-red-500
                hover:bg-red-50 transition-all duration-200 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        )}
      </CardContent>

      {showChart && (
        <CardFooter className="pt-0 px-6 pb-5 animate-fade-up">
          <PriceChart productId={product.id} />
        </CardFooter>
      )}
    </Card>
  );
}
