import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uniflow — персональный маршрут поступления",
  description:
    "Подбор программ Казахстана, объяснимые рекомендации и персональный план поступления.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
