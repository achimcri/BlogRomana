#!/bin/sh
set -e

echo "→ Aștept SQL Server și pregătesc baza de date…"
npx tsx scripts/ensure-db.ts

echo "→ Aplic migrările…"
npx prisma migrate deploy

echo "→ Date demo…"
npx tsx prisma/seed.ts

echo "→ Pornesc aplicația pe http://localhost:3000"
exec npx next dev --hostname 0.0.0.0 --port 3000
