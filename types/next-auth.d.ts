// Extinde tipurile Auth.js cu campurile pe care le punem noi in sesiune
// (vezi callback-urile jwt/session din lib/auth.ts).
import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
  }
}

export {};
