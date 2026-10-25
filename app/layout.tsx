import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JAF Dossier — Préparation documentaire",
  description: "Constituez et organisez votre dossier de travail pour votre avocat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
