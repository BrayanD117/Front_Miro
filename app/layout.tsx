import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import '@mantine/dates/styles.css';
import 'mantine-datatable/styles.layer.css';
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";
import { Notifications } from "@mantine/notifications";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { RoleProvider } from "./context/RoleContext";
import { AppInitializer } from "./context/AppInitializer";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "MIRÓ",
  description: "Miró",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>
          <MantineProvider>
            <RoleProvider initialRole="Usuario">
              <AppInitializer>
                <Notifications />
                <ClientLayout>{children}</ClientLayout>
              </AppInitializer>
            </RoleProvider>
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
