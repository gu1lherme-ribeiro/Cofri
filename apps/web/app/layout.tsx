import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pingo · Estúdio",
  description: "Suas finanças e lembretes — sem precisar virar contador.",
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
