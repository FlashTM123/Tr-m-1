// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Social Network",
    default: "Social Network",
  },
  description: "Mạng xã hội kết nối mọi người",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* 
          Providers là Client Component, nhưng children (Server Components) 
          vẫn được render phía server nhờ kỹ thuật "passing children as props".
          Next.js đủ thông minh để không làm mất SSR ở đây.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
