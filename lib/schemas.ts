import { z } from "zod";

/**
 * Validates the raw `data` payload returned by Firecrawl's `extract()` call.
 * The Firecrawl SDK types this field as `unknown` (it's shaped by whatever
 * JSON schema/prompt we send at request time), so this is the actual
 * boundary where untrusted external data enters the app.
 */
export const FirecrawlExtractedDataSchema = z.object({
  productName: z.string(),
  currentPrice: z.union([z.number(), z.string()]),
  currencyCode: z.string().optional(),
  productImageUrl: z.string().optional(),
});

export type FirecrawlExtractedData = z.infer<
  typeof FirecrawlExtractedDataSchema
>;
