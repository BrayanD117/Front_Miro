import "@mantine/core/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";

import { MantineProvider, ColorSchemeScript } from "@mantine/core";

// Components
import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar";

export const metadata: Metadata = {
  title: "MIRÓ",
  description: "Miró",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>
          <MantineProvider>
            <Navbar />
            {children}
            <Footer />
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
