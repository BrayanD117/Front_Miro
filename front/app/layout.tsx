import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";
import { Notifications } from "@mantine/notifications";

import { MantineProvider, ColorSchemeScript } from "@mantine/core";

import { RoleProvider } from "./context/RoleContext";

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
            <RoleProvider>
              <Notifications />
              <Navbar />
              {children}
              <Footer />
            </RoleProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
