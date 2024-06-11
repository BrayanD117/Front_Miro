import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoClient } from "mongodb";
import { NextAuthOptions } from "next-auth";

const client = new MongoClient(process.env.MONGODB_URI as string);

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
      await client.connect();
      const db = client.db();
      const usersCollection = db.collection('users');

      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser && existingUser.isActive === false) {
        return false; // No permitir el acceso si el usuario está inactivo
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      return '/dashboard';
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const user = await client.db().collection('users').findOne({ email: session.user.email });
        if (user) {
          session.user.role = user.activeRole;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(options);

export { handler as GET, handler as POST };
