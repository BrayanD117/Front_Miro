// types/next-auth.d.ts

import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      isImpersonating?: boolean;
    };
  }

  interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isImpersonating?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isImpersonating?: boolean;
  }
}
