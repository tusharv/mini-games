import type { Metadata } from "next";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Poppins } from 'next/font/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Mini Games - Fun Brain Training Games",
  description: "A collection of engaging mini games designed to improve cognitive skills, memory, and reaction time. Play bubble burst, tap master, memory flip, and more!",
  keywords: ["brain games", "cognitive training", "memory games", "reaction games", "puzzle games", "mini games"],
  authors: [{ name: "The Working Prototype" }],
  icons: {
    icon: [
      {
        url: "/images/logo.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        sizes: "any",
      }
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      }
    ]
  },
  openGraph: {
    title: "Mini Games - Fun Brain Training Games",
    description: "A collection of engaging mini games designed to improve cognitive skills, memory, and reaction time.",
    type: "website",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "Mental Mint - Fun Brain Training Games"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mini Games - Fun Brain Training Games",
    description: "A collection of engaging mini games designed to improve cognitive skills, memory, and reaction time.",
    images: ["/preview.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <GoogleTagManager gtmId="GTM-N79SB82J" />
        <GoogleAnalytics gaId="AW-16994498449" />
        <Script id="dataLayer-init" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-16994498449');
            }
          `}
        </Script>
        <link
          href="https://fonts.cdnfonts.com/css/nokia-cellphone-fc"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${poppins.className}`}>
        {children}
      </body>
    </html>
  );
}
