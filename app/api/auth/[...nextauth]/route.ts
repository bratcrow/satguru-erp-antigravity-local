import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
        pinCode: { label: "PIN Code", type: "password" },
        isPinLogin: { label: "Is PIN Login", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        if (credentials.isPinLogin === "true") {
          // Handle PIN Unlock
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });
          
          if (!user || !user.pinCode) return null;
          
          if (credentials.pinCode === user.pinCode) {
            return {
              id: user.id,
              name: user.username,
              role: user.role,
              allowedPages: user.allowedPages,
            };
          }
          return null;
        } else {
          // Handle standard password login
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          });

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) return null;

          return {
            id: user.id,
            name: user.username,
            role: user.role,
            allowedPages: user.allowedPages,
          };
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.allowedPages = (user as any).allowedPages;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).user.role = token.role;
        (session as any).user.allowedPages = token.allowedPages;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
});

export { handler as GET, handler as POST };
