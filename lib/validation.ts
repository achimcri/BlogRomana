import * as z from "zod";

import { textDinHtml } from "@/lib/sanitize";
import { POST_STATUSES } from "@/lib/types";

/*
  Schemele de validare. Se aplica INTOTDEAUNA pe server, in server actions.
  Validarea din browser exista doar ca sa dea mesaje rapide; o cerere trimisa
  direct, fara sa treaca prin formular, ajunge tot aici.
*/

/** Lungimea textului efectiv, ignorand tag-urile HTML. */
function lungimeText(html: string): number {
  return textDinHtml(html).length;
}

const continut = z
  .string()
  .max(200_000, { error: "Textul este prea lung." })
  .refine((html) => lungimeText(html) >= 20, {
    error: "Textul este prea scurt. Scrie cel puțin câteva propoziții.",
  });

const titlu = z
  .string()
  .trim()
  .min(3, { error: "Titlul trebuie să aibă cel puțin 3 caractere." })
  .max(300, { error: "Titlul este prea lung." });

/**
 * Nume si prenume: acceptam diacritice, cratima si apostrof (Ana-Maria, D'Arcy),
 * dar nu cifre sau semne care nu apar in nume reale.
 */
const numePersoana = (eticheta: string) =>
  z
    .string()
    .trim()
    .min(2, { error: `${eticheta} trebuie să aibă cel puțin 2 litere.` })
    .max(100, { error: `${eticheta} este prea lung.` })
    .regex(/^[\p{L}][\p{L}\s'’-]*$/u, {
      error: `${eticheta} poate conține doar litere, cratimă și apostrof.`,
    });

/** Formularul public de submisie al elevului. */
export const schemaSubmisieElev = z.object({
  title: titlu,
  contentHtml: continut,
  studentFirstName: numePersoana("Prenumele"),
  studentLastName: numePersoana("Numele"),
  studentClass: z
    .string()
    .trim()
    .min(1, { error: "Scrie clasa." })
    .max(50, { error: "Clasa este prea lungă." }),
  // Id-urile pozelor deja incarcate, in ordinea aleasa.
  imageIds: z.array(z.string().max(30)).max(10).optional(),
});

export type DateSubmisieElev = z.infer<typeof schemaSubmisieElev>;

/** Postare scrisa de profesoara din panoul de administrare. */
export const schemaPostareProfesoara = z.object({
  title: titlu,
  contentHtml: continut,
  status: z.enum(POST_STATUSES),
  imageIds: z.array(z.string().max(30)).max(20).optional(),
});

/** Aprobarea unei submisii: profesoara alege cum apare public autorul. */
export const schemaAprobare = z.object({
  postId: z.string().min(1).max(30),
  // Vezi nota GDPR din plan: implicit publicam prenume + initiala, nu numele
  // complet al unui minor.
  displayName: z
    .string()
    .trim()
    .min(1, { error: "Scrie cum apare autorul." })
    .max(200),
});

export const schemaRespingere = z.object({
  postId: z.string().min(1).max(30),
  rejectionReason: z.string().trim().max(1000).optional(),
});

export const schemaSetari = z.object({
  siteTitle: z.string().trim().min(1).max(200),
  siteTagline: z.string().trim().max(500).optional(),
  aboutHtml: z.string().max(200_000).optional(),
});

/**
 * Propune numele public implicit: prenume + initiala numelui de familie.
 * "Maria" + "Popescu" -> "Maria P."
 */
export function numePublicImplicit(prenume: string, nume: string): string {
  const p = prenume.trim();
  const initiala = nume.trim().charAt(0).toUpperCase();
  return initiala ? `${p} ${initiala}.` : p;
}

/** Transforma erorile Zod intr-o harta camp -> primul mesaj, pentru formulare. */
export function erori(rezultat: z.ZodError): Record<string, string> {
  const harta: Record<string, string> = {};
  for (const problema of rezultat.issues) {
    const camp = problema.path.join(".");
    if (camp && !harta[camp]) harta[camp] = problema.message;
  }
  return harta;
}
