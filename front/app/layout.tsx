import "@mantine/core/styles.css";
import type { Metadata } from "next";
import "./globals.css";

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
        <MantineProvider >
          <Navbar />
          {children}
          <Footer />
        </MantineProvider>
      </body>
    </html>
  );
}
