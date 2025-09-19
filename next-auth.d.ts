import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      scopes: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    scopes: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    scopes?: string[];
  }
}
