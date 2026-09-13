import "dotenv/config";

import { createPrismaClient } from "../lib/prisma-client";
import { construiesteExtras } from "../lib/sanitize";

const prisma = createPrismaClient();

/**
 * Date de pornire pentru dezvoltare locala.
 * Idempotent: se poate rula de cate ori vrei.
 *
 *   npm run db:seed
 */
async function main() {
  // Randul unic de setari (id = 1).
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteTitle: "Blog de Limba Română",
      siteTagline: "Lucrările elevilor, publicate de doamna profesoară",
      aboutHtml:
        "<p>Aici publicăm compuneri, analize și lucrări ale elevilor. " +
        "Fiecare text apare doar după ce a fost citit și aprobat de doamna profesoară.</p>",
    },
  });

  const demoPosts = [
    {
      slug: "toamna-in-parcul-scolii",
      title: "Toamna în parcul școlii",
      contentHtml:
        "<p>Frunzele au început să cadă peste aleea din fața școlii. " +
        "În fiecare dimineață, covorul de frunze este puțin mai gros, iar " +
        "pașii noștri fac un zgomot moale când trecem peste el.</p>" +
        "<p>Îmi place cel mai mult castanul bătrân din colț, pentru că " +
        "își schimbă culoarea înaintea celorlalți copaci. Anul trecut am " +
        "adunat castane de sub el și le-am pus într-un borcan pe pervaz.</p>" +
        "<p>Doamna profesoară ne-a spus că toamna este anotimpul care " +
        "i-a inspirat pe cei mai mulți poeți români. Acum înțeleg de ce: " +
        "când stai în parc și te uiți în sus, printre crengi, parcă cineva " +
        "a schimbat culorile peste noapte, fără să te întrebe.</p>",
      status: "PUBLISHED",
      authorType: "STUDENT",
      studentFirstName: "Maria",
      studentLastName: "Popescu",
      studentClass: "a VI-a B",
      displayName: "Maria P.",
      publishedAt: new Date("2026-09-05T09:00:00Z"),
    },
    {
      // Scurt intentionat: pe acesta NU trebuie sa apara "Citește mai mult".
      slug: "despre-lectura-de-vara",
      title: "Despre lectura de vară",
      contentHtml:
        "<p>Vara aceasta am citit trei cărți. Cel mai mult mi-a plăcut " +
        "<em>Amintiri din copilărie</em>, pentru că m-a făcut să râd.</p>",
      status: "PUBLISHED",
      authorType: "STUDENT",
      studentFirstName: "Andrei",
      studentLastName: "Ionescu",
      studentClass: "a VII-a A",
      displayName: "Andrei I.",
      publishedAt: new Date("2026-09-08T09:00:00Z"),
    },
    {
      // Ramane in asteptare, ca sa poti testa coada de aprobare din /admin.
      slug: "prima-zi-de-scoala",
      title: "Prima zi de școală",
      contentHtml:
        "<p>Prima zi de școală a fost emoționantă. Am revăzut colegii " +
        "după trei luni și ne-am povestit tot ce am făcut în vacanță.</p>" +
        "<p>Cel mai mult m-am bucurat că stau iar în aceeași bancă cu " +
        "Ioana. Ne-am promis că anul acesta o să fim mai atente la ore.</p>",
      status: "PENDING",
      authorType: "STUDENT",
      studentFirstName: "Ioana",
      studentLastName: "Marin",
      studentClass: "a VI-a B",
      displayName: null,
      publishedAt: null,
    },
  ];

  for (const post of demoPosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        excerpt: construiesteExtras(post.contentHtml),
      },
    });
  }

  const [published, pending] = await Promise.all([
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "PENDING" } }),
  ]);

  console.log(
    `Seed complet: ${published} postări publicate, ${pending} în așteptare.`,
  );
}

main()
  .catch((e) => {
    console.error("Seed eșuat:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
