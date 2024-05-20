import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
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
    maxAge:  3600 * 8,
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return '/dashboard';
    },
  },
});

export { handler as GET, handler as POST };
