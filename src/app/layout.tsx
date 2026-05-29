import type { Metadata } from "next";
import { Playfair_Display, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "MedBoutique OS",
  description: "Clinical Excellence through Luxury. The premium clinic operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth", playfair.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased selection:bg-[var(--tertiary-fixed)] selection:text-[var(--teal-dark)]">
        {children}
      </body>
    </html>
  );
}
