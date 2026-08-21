import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/email";
import type { Database } from "@/types/supabase";

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  "₹": "INR",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

const normalizeCurrency = (raw: string | undefined, fallback: string): string => {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  return CURRENCY_SYMBOL_MAP[trimmed] ?? trimmed.toUpperCase();
};

interface CronResults {
  total: number;
  updated: number;
  failed: number;
  priceChanges: number;
  alertsSent: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to check`);

    const results: CronResults = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData.currentPrice) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(
          String(productData.currentPrice).replace(/[^\d.]/g, ""),
        );

        if (isNaN(newPrice) || newPrice < 1) {
          console.error(`Invalid price for product ${product.id}: ${productData.currentPrice}`);
          results.failed++;
          continue;
        }

        const oldPrice = parseFloat(product.current_price);
        const currency = normalizeCurrency(productData.currencyCode, product.currency);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency,
            name: productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (Math.abs(oldPrice - newPrice) > 0.01) {
          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency,
          });

          results.priceChanges++;

          if (newPrice < oldPrice) {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) {
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice,
              );

              if (emailResult.success) {
                results.alertsSent++;
              }
            }
          }
        }

        results.updated++;
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
