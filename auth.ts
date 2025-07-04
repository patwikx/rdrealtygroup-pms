import NextAuth from "next-auth"
import { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";
import { getUserById } from "@/data/user";
import { getAccountByUserId } from "./data/account";
import { logUserLogin } from "./lib/audit-login-logout";


export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  update,
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") {
        // Log OAuth login
        if (user.id) {
          await logUserLogin(
            user.id,
            undefined, // IP will be captured in API route if needed
            undefined, // User agent will be captured in API route if needed
            account?.provider || "oauth"
          );
        }
        return true;
      }

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) {
        // Log failed login attempt
        if (user.id) {
          await logUserLogin(
            user.id,
            undefined,
            undefined,
            "credentials_failed"
          );
        }
        return true;
      }

      // Log successful credentials login
      if (user.id) {
        await logUserLogin(
          user.id,
          undefined,
          undefined,
          "credentials"
        );
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(
        existingUser.id
      );

      token.isOAuth = !!existingAccount;
      token.firstName = existingUser.firstName;
      token.lastName = existingUser.lastName;
      token.id = existingUser.id;
      token.email = existingUser.email;
      token.role = existingUser.role;

      return token;
    }
  },
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 24 * 60 * 60, 
  },
  ...authConfig,
});