import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthera - Premium AI Video Platform",
  description: "Discover, create, and monetize AI-generated video content on the premier platform for digital artistry.",
  keywords: ["AI video", "synthetic media", "video creation", "digital art", "NFT"],
  authors: [{ name: "Synthera" }],
  creator: "Synthera",
  publisher: "Synthera",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://synthera.ai"),
  openGraph: {
    title: "Synthera - Premium AI Video Platform",
    description: "Discover, create, and monetize AI-generated video content on the premier platform for digital artistry.",
    url: "https://synthera.ai",
    siteName: "Synthera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Synthera - Premium AI Video Platform",
    description: "Discover, create, and monetize AI-generated video content on the premier platform for digital artistry.",
    creator: "@synthera",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen synthera-gradient">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
