import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lia | Painel Dr. Darcy",
  description: "Painel operacional do consultório Dr. Darcy Mavignier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-950">{children}</body>
    </html>
  );
}
