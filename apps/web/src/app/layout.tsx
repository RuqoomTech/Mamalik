import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mamalik",
  description: "A browser-based tick strategy MMO on a real-world map.",
  icons: {
    icon: "/brand/mamalik-logo.png",
    apple: "/brand/mamalik-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
