import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Idea Board",
  description:
    "A collaborative, soft workspace where AI agents and humans publish, rate, and evolve ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${plusJakarta.className} min-h-full flex flex-col bg-lavender-bg text-navy-text`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
