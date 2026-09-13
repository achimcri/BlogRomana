// Fabrica de client Prisma, fara `server-only`, ca sa poata fi folosita si din
// scripturi Node rulate direct (seed, migrari, job-uri de mentenanta).
//
// Codul de aplicatie NU importa fisierul asta: foloseste `prisma` din lib/db.ts,
// care adauga garda `server-only` si singleton-ul pentru hot reload.

import { PrismaMssql } from "@prisma/adapter-mssql";
import type { config as MssqlConfig } from "mssql";

import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma foloseste formatul JDBC pentru SQL Server:
 *   sqlserver://HOST:PORT;database=X;user=Y;password=Z;encrypt=true
 * Driverul `mssql` nu intelege formatul asta, deci il traducem.
 *
 * Aceeasi variabila DATABASE_URL ramane folosita si de CLI-ul Prisma
 * (migrari), ca sa nu avem doua surse de adevar.
 */
export function parseSqlServerUrl(url: string): MssqlConfig {
  const withoutScheme = url.replace(/^sqlserver:\/\//i, "");
  const [hostPart, ...paramParts] = withoutScheme.split(";");

  const [server, portRaw] = hostPart.split(":");
  const params = new Map<string, string>();
  for (const part of paramParts) {
    if (!part) continue;
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    params.set(
      part.slice(0, idx).trim().toLowerCase(),
      part.slice(idx + 1).trim(),
    );
  }

  const database = params.get("database");
  const user = params.get("user") ?? params.get("userid") ?? params.get("uid");
  const password = params.get("password") ?? params.get("pwd");

  if (!server || !database || !user || !password) {
    throw new Error(
      "DATABASE_URL este incomplet: trebuie server, database, user si password.",
    );
  }

  return {
    server,
    port: portRaw ? Number(portRaw) : 1433,
    database,
    user,
    password,
    options: {
      // Azure SQL cere criptare. Local, docker-compose foloseste un certificat
      // self-signed, deci trustServerCertificate=true doar acolo.
      encrypt: params.get("encrypt") !== "false",
      trustServerCertificate: params.get("trustservercertificate") === "true",
    },
    pool: {
      min: 0,
      max: 5,
      // Elibereaza conexiunile repede: pe Azure SQL serverless nu vrem sa tinem
      // baza de date treaza degeaba, pentru ca bugetul gratuit se consuma.
      idleTimeoutMillis: 30_000,
    },
    // IMPORTANT: Azure SQL serverless se auto-pauzeaza. Prima cerere dupa pauza
    // asteapta ~30s cat se reia baza de date. Timeout-ul implicit al lui `mssql`
    // este 15s, adica ar esua exact atunci. De aceea 60s.
    connectionTimeout: 60_000,
    requestTimeout: 60_000,
  };
}

export function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL lipseste. Copiaza .env.example in .env.");
  }

  const adapter = new PrismaMssql(parseSqlServerUrl(url), {
    // Fara handlere, o eroare de pool poate darama procesul Node.
    onPoolError: (err) => console.error("[prisma] eroare de pool:", err),
    onConnectionError: (err) =>
      console.error("[prisma] eroare de conexiune:", err),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}
