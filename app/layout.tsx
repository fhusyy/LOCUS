import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "UniFlow — AI Personal Admission Journey | Твой маршрут в университет",
  description:
    "Персональный AI-навигатор для абитуриентов. Диагностика шансов, честный подбор программ под бюджет и баллы ЕНТ, пошаговый Roadmap поступления.",
  keywords: ["поступление в вузы казахстана", "ент", "ielts", "aitu", "kbtu", "iitu", "sdu", "nu", "грант", "locus admission"],
  openGraph: {
    title: "UniFlow — Персональный AI-маршрут поступления в вузы",
    description: "Честный matching, объективная диагностика, прозрачные данные о грантах и персональная дорожная карта.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,300..900;1,300..900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
