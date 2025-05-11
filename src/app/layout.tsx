import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "美容師アプリ",
  description: "予約とカルテを管理するアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}