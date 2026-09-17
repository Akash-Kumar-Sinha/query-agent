import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: "Query Agent",
  description: "Natural language analytical query engine and validator",
  openGraph: {
    title: "Query Agent",
    description: "Natural language analytical query engine and validator",
    type: "website",
    images: [
      {
        url: "/metadata/landing.png",
        width: 1200,
        height: 630,
        alt: "Query Agent Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Query Agent",
    description: "Natural language analytical query engine and validator",
    images: ["/metadata/landing.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
