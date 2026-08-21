import { Resend, type CreateEmailResponseSuccess, type ErrorResponse } from "resend";
import type { Product } from "@/types/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  "₹": "INR",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

const formatPrice = (price: number, currency = "INR"): string => {
  const code = CURRENCY_SYMBOL_MAP[currency] ?? currency.toUpperCase();
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(price);
};

export type SendPriceDropAlertResult =
  | { success: true; data: CreateEmailResponseSuccess | null; error?: undefined }
  | { success?: undefined; error: ErrorResponse | string };

export async function sendPriceDropAlert(
  userEmail: string,
  product: Product,
  oldPrice: number,
  newPrice: number,
): Promise<SendPriceDropAlertResult> {
  try {
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error("RESEND_FROM_EMAIL is not set in environment variables");
    }

    const priceDrop = oldPrice - newPrice;
    const percentageDrop = ((priceDrop / oldPrice) * 100).toFixed(1);
    const formattedOld = formatPrice(oldPrice, product.currency);
    const formattedNew = formatPrice(newPrice, product.currency);
    const formattedSaving = formatPrice(priceDrop, product.currency);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: userEmail,
      subject: `Price dropped ${percentageDrop}% — ${product.name}`,
      text: `
Dropwatch — Price Drop Alert

${product.name} just dropped in price.

Previous price: ${formattedOld}
Current price:  ${formattedNew}
You save:       ${formattedSaving} (${percentageDrop}%)

View product: ${product.url}
View all tracked products: ${process.env.NEXT_PUBLIC_APP_URL}

You're receiving this because you're tracking this product on Dropwatch.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">

  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ea580c;letter-spacing:-0.3px;">dropwatch</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <!-- Product image -->
      ${product.image_url ? `
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${product.image_url}" alt="${product.name}"
          style="width:120px;height:120px;object-fit:cover;border-radius:12px;border:1px solid #f3f4f6;">
      </div>` : ""}

      <!-- Drop badge -->
      <div style="display:inline-block;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;
        padding:4px 12px;border-radius:999px;margin-bottom:16px;">
        ↓ ${percentageDrop}% price drop
      </div>

      <!-- Product name -->
      <h2 style="margin:0 0 24px;font-size:17px;font-weight:600;color:#111827;line-height:1.4;">
        ${product.name}
      </h2>

      <!-- Price comparison -->
      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Was</td>
            <td style="padding:8px 0;font-size:15px;color:#9ca3af;text-decoration:line-through;text-align:right;">
              ${formattedOld}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Now</td>
            <td style="padding:8px 0;font-size:24px;font-weight:700;color:#ea580c;text-align:right;">
              ${formattedNew}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:12px;border-top:1px solid #e5e7eb;"></td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#15803d;font-weight:500;">You save</td>
            <td style="padding:4px 0;font-size:15px;font-weight:600;color:#15803d;text-align:right;">
              ${formattedSaving}
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${product.url}"
          style="display:inline-block;background:#ea580c;color:#ffffff;padding:13px 28px;
            border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
          Buy now →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
        You're tracking this product on Dropwatch.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}"
        style="font-size:12px;color:#ea580c;text-decoration:none;">
        View all tracked products
      </a>
    </div>

  </div>

</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message };
  }
}
