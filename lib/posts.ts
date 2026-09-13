import "server-only";

import { prisma } from "@/lib/db";
import { previzualizare } from "@/lib/sanitize";

/** Cate caractere de text se arata in lista, inainte de "Citește mai mult". */
const LUNGIME_PREVIZUALIZARE = 340;

/*
  Citirile pentru partea publica.

  Toate filtreaza pe status = "PUBLISHED". Un text al unui elev care asteapta
  aprobarea nu trebuie sa fie accesibil nici macar cu link direct -- de aceea
  filtrul sta aici, in stratul de date, nu in componente.
*/

const CAMPURI_LISTARE = {
  id: true,
  slug: true,
  title: true,
  // Continutul complet, ca sa putem calcula previzualizarea SI sa stim daca
  // textul continua dincolo de ea.
  //
  // La scara unei scoli (zeci-sute de postari) e neglijabil, mai ales ca
  // pagina se randeaza rar (ISR). Daca blogul ajunge la mii de postari,
  // muta lungimea textului intr-o coloana separata, scrisa la salvare.
  contentHtml: true,
  displayName: true,
  studentClass: true,
  publishedAt: true,
} as const;

export type PostareListare = {
  id: string;
  slug: string;
  title: string;
  previzualizare: string;
  trunchiat: boolean;
  displayName: string | null;
  studentClass: string | null;
  publishedAt: Date | null;
};

/** Postarile publicate, cele mai recente primele. */
export async function listeazaPostariPublicate(
  limita?: number,
): Promise<PostareListare[]> {
  const randuri = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: CAMPURI_LISTARE,
    ...(limita ? { take: limita } : {}),
  });

  return randuri.map(({ contentHtml, ...rest }) => {
    const p = previzualizare(contentHtml, LUNGIME_PREVIZUALIZARE);
    return { ...rest, previzualizare: p.text, trunchiat: p.trunchiat };
  });
}

/** O postare publicata, dupa slug. `null` daca nu exista sau nu e publicata. */
export async function gasestePostarePublicata(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

/** Slug-urile publicate, pentru generateStaticParams. */
export async function slugsPublicate(): Promise<string[]> {
  const postari = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return postari.map((p) => p.slug);
}

export async function citesteSetari() {
  return prisma.siteSettings.findUnique({ where: { id: 1 } });
}

/**
 * Numele afisat public. Cade pe "Un elev" daca nu s-a stabilit displayName --
 * niciodata pe numele complet din baza de date, ca sa nu publicam accidental
 * datele unui minor. Vezi nota GDPR din plan.
 */
export function autorPublic(postare: {
  displayName: string | null;
}): string {
  return postare.displayName?.trim() || "Un elev";
}

const FORMAT_DATA = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formateazaData(data: Date | null): string {
  return data ? FORMAT_DATA.format(data) : "";
}
