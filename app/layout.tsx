import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHOP4EVERYTHING",
  description: "Modern online shopping store with instant WhatsApp ordering and live automatic price calculation.",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icon-192.png" },
    { rel: "apple-touch-icon", url: "/icon-192.png" },
  ],
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
        <meta name="theme-color" content="#ff3366" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SHOP4EVERYTHING" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
