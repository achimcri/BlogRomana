// Importul asta face build-ul sa esueze daca `prisma` ajunge vreodata intr-o
// componenta de client. E singura plasa de siguranta impotriva scurgerii
// credentialelor de baza de date in bundle-ul trimis in browser.
import "server-only";

import { createPrismaClient } from "@/lib/prisma-client";

// In dev, hot reload re-executa modulul la fiecare salvare. Fara singleton,
// fiecare reincarcare ar deschide un pool nou si am epuiza conexiunile.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
