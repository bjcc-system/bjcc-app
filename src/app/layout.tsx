import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const APP_NAME = "BJCC Cricket";
const APP_DEFAULT_TITLE = "Beltala Jr Cricket Council";
const APP_TITLE_TEMPLATE = "%s - BJCC";
const APP_DESCRIPTION =
  "Official App of Beltala Jr Cricket Council for Live Scores, Tournaments & Leaderboards.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bjcc.vercel.app"),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "Beltala Jr Cricket Council",
    "BJCC",
    "BJCC Cricket",
    "Beltala Cricket",
    "BJCC live score",
    "Beltala Junior Cricket",
    "cricket tournament",
    "local cricket league",
    "cricket live scoring",
    "cricket leaderboards",
    "cricket stats"
  ],
  authors: [{ name: "Beltala Jr Cricket Council" }],
  creator: "BJCC",
  publisher: "Beltala Jr Cricket Council",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0e1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased relative min-h-screen`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              "name": "Beltala Jr Cricket Council",
              "alternateName": "BJCC",
              "url": "https://bjcc.vercel.app",
              "logo": "https://bjcc.vercel.app/window.svg",
              "description": "Official App of Beltala Jr Cricket Council for Live Scores, Tournaments & Leaderboards.",
              "sport": "Cricket"
            })
          }}
        />
        {/* Global Stadium Background */}
        <div 
          className="fixed inset-0 z-[-1] pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.03
          }}
        />
        {children}
      </body>
    </html>
  );
}
