import "dotenv/config";
import sql from "mssql";

import { parseSqlServerUrl } from "../lib/prisma-client";

/*
  Creeaza baza de date daca nu exista.

  Prisma nu poate crea singur o baza de date pe SQL Server (spre deosebire de
  PostgreSQL), iar `migrate deploy` esueaza daca baza lipseste. Scriptul asta
  se conecteaza la `master` si o creeaza -- ruleaza la fiecare pornire a
  containerului, deci trebuie sa fie idempotent.

  Asteapta si ca serverul sa accepte conexiuni: healthcheck-ul din compose
  raspunde uneori inainte ca SQL Server sa fie complet pornit.
*/

const INCERCARI = 30;
const PAUZA_MS = 2000;

function asteapta(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL lipseste.");

  const config = parseSqlServerUrl(url);
  const numeBaza = config.database;
  if (!numeBaza) throw new Error("DATABASE_URL nu contine `database=`.");

  // Ne conectam la `master`, nu la baza tinta -- care poate sa nu existe inca.
  const configMaster: sql.config = { ...config, database: "master" };

  let ultimaEroare: unknown;
  for (let i = 1; i <= INCERCARI; i++) {
    try {
      const pool = await sql.connect(configMaster);
      await pool
        .request()
        .query(
          `IF DB_ID('${numeBaza.replace(/'/g, "''")}') IS NULL CREATE DATABASE [${numeBaza.replace(/]/g, "]]")}]`,
        );
      await pool.close();
      console.log(`[ensure-db] baza de date "${numeBaza}" este pregătită`);
      return;
    } catch (err) {
      ultimaEroare = err;
      console.log(
        `[ensure-db] SQL Server încă nu răspunde (încercarea ${i}/${INCERCARI})…`,
      );
      await asteapta(PAUZA_MS);
    }
  }

  console.error("[ensure-db] nu m-am putut conecta la SQL Server:", ultimaEroare);
  process.exit(1);
}

main();
