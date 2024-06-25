import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import axios from 'axios';

const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: '/signIn',
  },
  session: {
    maxAge: 3600 * 8,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          params: { email: user.email }
        });
        const existingUser = response.data;

        if (existingUser && existingUser.isActive === false) {
          return false; // No permitir el acceso si el usuario está inactivo
        }

        return true;
      } catch (error) {
        console.error("Error checking user:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      return '/dashboard';
    },
    async session({ session, token }) {
      try {
        if (session.user?.email) {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            params: { email: session.user.email }
          });
          const user = response.data;
          if (user) {
            session.user.role = user.activeRole;
          }
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
      }
      return session;
    },
  },
};

const handler = NextAuth(options);

export { handler as GET, handler as POST };
