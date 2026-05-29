import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Leads",
  description: "Internal TikTok LIVE sales lead dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
