import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Account / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { name: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });
        if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
          return null;
        }
        if (!user.emailVerified) {
          return null;
        }
        await db.auditLog.create({ data: { actorId: user.id, action: "SIGN_IN", entityType: "User", entityId: user.id } });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.systemRole = user.systemRole;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.systemRole = token.systemRole ?? "MEMBER";
      }
      return session;
    },
  },
};
