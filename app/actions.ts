"use server";

import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Product, PriceHistoryEntry } from "@/types/supabase";

export type AddProductResult =
  | { error: string; success?: undefined; product?: undefined; message?: undefined }
  | { success: true; product: Product; message: string; error?: undefined };

export async function addProduct(formData: FormData): Promise<AddProductResult> {
  const url = formData.get("url");

  if (!url || typeof url !== "string") {
    return { error: "URL is required" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Scrape product data with Firecrawl
    const productData = await scrapeProduct(url);

    if (!productData.productName || !productData.currentPrice) {
      console.log(productData, "productData");
      return { error: "Could not extract product information from this URL" };
    }

    const newPrice = parseFloat(
      String(productData.currentPrice).replace(/[^\d.]/g, ""),
    );
    const currency = productData.currencyCode || "USD";

    if (isNaN(newPrice)) {
      return { error: "Could not extract valid price from this URL" };
    }

    // Check if product exists to determine if it's an update
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, current_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    const isUpdate = !!existingProduct;

    // Upsert product (insert or update based on user_id + url)
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url,
          name: productData.productName,
          current_price: newPrice,
          currency: currency,
          image_url: productData.productImageUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,url", // Unique constraint on user_id + url
          ignoreDuplicates: false, // Always update if exists
        },
      )
      .select()
      .single();

    if (error || !product) {
      throw error ?? new Error("Failed to upsert product");
    }

    // Add to price history if it's a new product OR price changed
    // (current_price comes back from Postgres as a numeric string; compare numerically)
    const shouldAddHistory =
      !isUpdate ||
      (existingProduct ? parseFloat(existingProduct.current_price) : null) !== newPrice;

    if (shouldAddHistory) {
      await supabase.from("price_history").insert({
        product_id: product.id,
        price: newPrice,
        currency: currency,
      });
    }

    revalidatePath("/");
    return {
      success: true,
      product,
      message: isUpdate
        ? "Product updated with latest price!"
        : "Product added successfully!",
    };
  } catch (error) {
    console.error("Add product error:", error);
    const message = error instanceof Error ? error.message : "Failed to add product";
    return { error: message };
  }
}

export type DeleteProductResult = { success: true } | { error: string };

export async function deleteProduct(productId: string): Promise<DeleteProductResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return { error: message };
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get products error:", error);
    return [];
  }
}

export type PricePoint = Pick<PriceHistoryEntry, "checked_at" | "price" | "currency">;

export async function getPriceHistory(productId: string): Promise<PricePoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;

    const history = data || [];
    if (history.length) return history;

    // If no history exists yet, fall back to the current product price so
    // the chart can show at least one point (e.g., after a manual price edit).
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("current_price, currency, updated_at, created_at")
      .eq("id", productId)
      .single();

    if (productError) throw productError;
    if (!product?.current_price) return [];

    return [
      {
        checked_at:
          product.updated_at || product.created_at || new Date().toISOString(),
        price: product.current_price,
        currency: product.currency,
      },
    ];
  } catch (error) {
    console.error("Get price history error:", error);
    return [];
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}
