 













import FirecrawlApp from "@mendable/firecrawl-js";
import { FirecrawlExtractedDataSchema } from "./schemas";

const apiKey = process.env.FIRECRAWL_API_KEY;

if (!apiKey) {
  throw new Error("FIRECRAWL_API_KEY is missing. Add it to .env.local");
}

const firecrawl = new FirecrawlApp({ apiKey });

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  "₹": "INR",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

const normalizeCurrency = (raw: string | undefined): string => {
  if (!raw) return "INR";
  const trimmed = raw.trim();
  return CURRENCY_SYMBOL_MAP[trimmed] ?? trimmed.toUpperCase();
};

const normalizePrice = (raw: string | number | undefined): number | null => {
  if (raw === undefined) return null;
  // Strip all non-numeric characters except dot
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  // If price looks suspiciously small (likely a decimal formatting bug), reject it
  if (parsed < 1) return null;
  return parsed;
};

export interface ScrapedProduct {
  productName: string;
  currentPrice: number;
  currencyCode: string;
  productImageUrl?: string;
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    const result = await firecrawl.extract({
      urls: [url],
      prompt:
        "Extract the product name as 'productName', the current selling price as a plain number with no currency symbols or commas as 'currentPrice', the ISO 4217 currency code (e.g. INR, USD, EUR, GBP — not the symbol) as 'currencyCode', and the product image URL as 'productImageUrl'.",
      schema: {
        type: "object",
        required: ["productName", "currentPrice"],
        properties: {
          productName: { type: "string" },
          currentPrice: { type: "number" },
          currencyCode: { type: "string" },
          productImageUrl: { type: "string" },
        },
      },
    });

    if (!result.data) {
      throw new Error("No data extracted from URL");
    }

    // result.data is `unknown` per the Firecrawl SDK — validate before use.
    const extractedData = FirecrawlExtractedDataSchema.parse(result.data);

    const price = normalizePrice(extractedData.currentPrice);
    if (!price) {
      throw new Error(`Invalid price extracted: ${extractedData.currentPrice}`);
    }

    return {
      ...extractedData,
      currentPrice: price,
      currencyCode: normalizeCurrency(extractedData.currencyCode),
    };
  } catch (error) {
    console.error("Firecrawl extract error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape product: ${message}`);
  }
}
