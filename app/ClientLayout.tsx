"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import ProtectedRoutes from "./utils/ProtectedRoutes";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const pathname = usePathname();

  const isSignInPage = pathname === '/signIn' || pathname === '/';

  return (
    <>
      {!isSignInPage && <Navbar />}
      <ProtectedRoutes>{children}</ProtectedRoutes>
      {!isSignInPage && <Footer />}
    </>
  );
};

export default ClientLayout;
