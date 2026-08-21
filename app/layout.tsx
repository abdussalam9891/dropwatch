import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DropWatch — Track Prices. Get Alerted. Buy at the Right Time.",
  description: "Add any product URL and DropWatch monitors the price for you. Get email alerts the moment it drops. Powered by real-time scraping across Amazon, Zara, Walmart, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

         <Toaster richColors />
      </body>
    </html>
  );
}
