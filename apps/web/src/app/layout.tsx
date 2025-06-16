import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Narrativ - Discover Amazing Stories",
  description: "Explore insights, experiences, and ideas from our community of passionate writers",
  keywords: ["blog", "stories", "writing", "articles", "community"],
  authors: [{ name: "Narrativ Team" }],
  creator: "Narrativ",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "Narrativ - Discover Amazing Stories",
    description: "Explore insights, experiences, and ideas from our community of passionate writers",
    siteName: "Narrativ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Narrativ - Discover Amazing Stories",
    description: "Explore insights, experiences, and ideas from our community of passionate writers",
    creator: "@narrativ",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
         suppressHydrationWarning={true}
      >
        <main className="relative flex min-h-screen flex-col">
          {children}
           <Toaster />
        </main>
      </body>
    </html>
  );
}
