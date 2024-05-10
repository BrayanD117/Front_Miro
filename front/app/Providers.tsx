"use client";
import { SessionProvider } from "next-auth/react";

// Application-wide session provider

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
