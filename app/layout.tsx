import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHOP4EVERYTHING",
  description: "Modern online shopping store with instant WhatsApp ordering and live automatic price calculation.",
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
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
