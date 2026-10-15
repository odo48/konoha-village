import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konoha Village — Mission Board",
  description:
    "A Naruto-themed operator board for a Claude agent company (Agent Works + clauboard, re-skinned as the Hidden Leaf).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
