import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cofri · Anota teus gastos conversando",
  description:
    "Estúdio de finanças por mensagem. Manda no Telegram em português desleixado — o Cofri entende, organiza por categoria e devolve um dashboard editável.",
  metadataBase: new URL(
    process.env.DASHBOARD_URL || "http://localhost:3000",
  ),
  openGraph: {
    title: "Cofri — Anota teus gastos conversando",
    description:
      "Mande mensagem natural no Telegram, o bot organiza e devolve um estúdio web editável.",
    url: "/",
    siteName: "Cofri",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/media/cofri-grid.jpeg",
        width: 1196,
        height: 670,
        alt: "Cofri — assistente financeiro via Telegram",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cofri — Anota teus gastos conversando",
    description:
      "Mande mensagem natural no Telegram, o bot organiza e devolve um estúdio web editável.",
    images: ["/media/cofri-grid.jpeg"],
  },
  icons: {
    icon: "/media/cofri-mascot.jpeg",
    apple: "/media/cofri-mascot.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
