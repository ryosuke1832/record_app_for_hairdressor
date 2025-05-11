import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "美容師アプリ - カレンダー",
  description: "予約とカルテを管理するカレンダーページ",
};

export default function CalendarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}