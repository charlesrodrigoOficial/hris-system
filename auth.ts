import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
// import { cookies } from "next/headers";
// import { authConfig } from "./auth.config";
import { UserRole } from "@prisma/client";
import { getBaseUrl } from "@/lib/constants";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "intelura.com";
const ALLOWED_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.PAYROLL_MANAGER,
]);
const AUTH_BASE_URL = getBaseUrl();

function getSafeRedirectUrl(url: string, baseUrl: string) {
  const effectiveBaseUrl =
    process.env.NODE_ENV === "production" ? AUTH_BASE_URL : baseUrl;

  if (url.startsWith("/")) {
    return `${effectiveBaseUrl}${url}`;
  }

  try {
    const parsedUrl = new URL(url);
    const parsedBaseUrl = new URL(effectiveBaseUrl);

    if (parsedUrl.origin === parsedBaseUrl.origin) {
      return url;
    }

    if (process.env.NODE_ENV === "production" && parsedUrl.hostname === "localhost") {
      return `${effectiveBaseUrl}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return effectiveBaseUrl;
  }

  return effectiveBaseUrl;
}

export const config = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();

        //Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });

        //check if user exist and password matches
        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password,
          );

          //If password is correct, return to user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              dateOfBirth: user.dateOfBirth,
            };
          }
        }
        //if not exist or password unmatched return null
        return null;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }: any) {
      return getSafeRedirectUrl(url, baseUrl);
    },

    //Gate access here
    async signIn({ user }: any) {
      const email = (user?.email ?? "").trim().toLowerCase();
      const role = user?.role as UserRole | undefined;

      const hasAllowedDomain = email.endsWith(`@${ALLOWED_DOMAIN}`);
      const hasAllowedRole = role ? ALLOWED_ROLES.has(role) : false;

      // allow if either condition is true
      return hasAllowedDomain || hasAllowedRole;
    },

    //Persist role/name into JWT
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role;
        token.name = user.name;
        token.dateOfBirth = user.dateOfBirth ?? null;
      }

      // optional: if you ever update the session name, keep token in sync
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      return token;
    },

    //Expose token fields into session
    async session({ session, user, trigger, token }: any) {
      //set user id from token
      session.user.id = (token.sub ?? "") as string;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.dateOfBirth = (token as any).dateOfBirth ?? null;

      console.log(token);
      //If there is an update, set the user name
      if (trigger === "update" && session?.user?.name) {
        session.user.name = session.user.name;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
