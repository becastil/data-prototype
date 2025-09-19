import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  passwordHash: z.string().min(10),
  role: z.string().min(1),
  scopes: z.array(z.string().min(1)).default([])
});

type EnvUser = z.infer<typeof userSchema>;

const developmentUsers: EnvUser[] = [
  {
    id: "dev-admin",
    email: "admin@example.com",
    name: "Dev Admin",
    passwordHash: "$2b$12$2zN/f.Q5/46Rl7Wat5KGmOeUxSnjVNHZQzqSi4bUjYT/3w.ipCe/S",
    role: "admin",
    scopes: ["phi:read", "phi:write"]
  }
];

function parseUsers(): EnvUser[] {
  const rawUsers = process.env.AUTH_USERS ?? process.env.NEXTAUTH_USERS;
  if (!rawUsers) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Missing AUTH_USERS environment variable. Provide a JSON array with id, email, passwordHash, role, and scopes."
      );
    }

    return developmentUsers;
  }

  const parsed = JSON.parse(rawUsers) as unknown;
  const users = z.array(userSchema).parse(parsed);
  return users;
}

function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing AUTH_SECRET environment variable.");
  }

  return "development-secret";
}

const authOptions: NextAuthOptions = {
  secret: resolveAuthSecret(),
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = parseUsers();
        const user = users.find(candidate => candidate.email.toLowerCase() === credentials.email.toLowerCase());
        if (!user) {
          return null;
        }

        const passwordMatches = await compare(credentials.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          scopes: user.scopes
        } as any;
      }
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // @ts-expect-error custom properties allowed via module augmentation
        token.role = user.role;
        // @ts-expect-error custom properties allowed via module augmentation
        token.scopes = user.scopes ?? [];
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = { id: token.sub ?? "", name: token.name ?? undefined, email: token.email ?? undefined };
      }

      if (token.sub) {
        session.user.id = token.sub;
      }

      const scopes = (token as any).scopes;
      const role = (token as any).role;
      if (Array.isArray(scopes)) {
        // @ts-expect-error module augmentation ensures property exists
        session.user.scopes = scopes;
      } else if (!Array.isArray((session.user as any).scopes)) {
        // @ts-expect-error module augmentation ensures property exists
        session.user.scopes = [];
      }

      if (typeof role === "string") {
        // @ts-expect-error module augmentation ensures property exists
        session.user.role = role;
      } else if (typeof (session.user as any).role !== "string") {
        // @ts-expect-error module augmentation ensures property exists
        session.user.role = "analyst";
      }

      return session;
    }
  }
};

const handlers = NextAuth(authOptions);

export { authOptions, handlers, getServerSession };

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
