"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import AffixButton from "./components/Affix/AffixButton";
import GoBackButton from "./components/GoBackButton/GoBackButton";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const pathname = usePathname();

  const isSignInPage = pathname === '/';

  return (
    <>
      {!isSignInPage && <Navbar />}
      <GoBackButton />
      <AffixButton/>
      <ProtectedRoutes>{children}</ProtectedRoutes>
      {!isSignInPage && <Footer />}
    </>
  );
};

export default ClientLayout;
