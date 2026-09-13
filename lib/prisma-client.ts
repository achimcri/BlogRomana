// Fabrica de client Prisma, fara `server-only`, ca sa poata fi folosita si din
// scripturi Node rulate direct (seed, migrari, job-uri de mentenanta).
//
// Codul de aplicatie NU importa fisierul asta: foloseste `prisma` din lib/db.ts,
// care adauga garda `server-only` si singleton-ul pentru hot reload.

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL lipseste. Copiaza .env.example in .env.");
  }

  const adapter = new PrismaPg({
    connectionString,
    // Neon inchide conexiunile inactive, iar pe Vercel fiecare functie
    // serverless are propriul pool. Un pool mic si conexiuni eliberate repede
    // evita epuizarea limitei de conexiuni a bazei de date.
    max: 5,
    idleTimeoutMillis: 30_000,
    // Neon porneste din starea suspendata la prima cerere. Implicitul
    // bibliotecii `pg` (fara timeout) e riscant in alt sens: o cerere blocata
    // ar tine functia serverless ocupata pana la limita ei.
    connectionTimeoutMillis: 20_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}
