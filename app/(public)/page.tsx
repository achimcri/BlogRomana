import Link from "next/link";

import {
  autorPublic,
  citesteSetari,
  formateazaData,
  listeazaPostariPublicate,
  type PostareListare,
} from "@/lib/posts";

// ISR: paginile publice se servesc din cache, deci vizitele obisnuite nu ating
// deloc baza de date. Pe Azure SQL serverless asta inseamna ca baza ramane
// pauzata si nu consuma din bugetul gratuit.
export const revalidate = 60;

export default async function PaginaPrincipala() {
  const [setari, postari] = await Promise.all([
    citesteSetari(),
    listeazaPostariPublicate(),
  ]);

  if (postari.length === 0) {
    return <StarePustie tagline={setari?.siteTagline} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-6">
      {/* Toate postarile au exact aceeasi forma, inclusiv cea mai recenta.
          Un tratament special pentru prima ar sugera o ierarhie care nu exista:
          textele elevilor sunt egale intre ele. */}
      <ul className="divide-y divide-liniatura">
        {postari.map((postare) => (
          <li key={postare.id}>
            <Postare postare={postare} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function Postare({ postare }: { postare: PostareListare }) {
  const autor = autorPublic(postare);

  return (
    <article className="py-12">
      {/* Autorul sus: cititorul stie de la inceput al cui e textul. */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stilou-deschis font-scris text-lg font-semibold text-stilou"
        >
          {autor.trim().charAt(0).toUpperCase()}
        </span>
        <div className="text-sm leading-snug">
          <p className="font-medium text-cerneala">{autor}</p>
          <p className="text-cerneala-stinsa">
            {[
              postare.studentClass,
              postare.publishedAt ? formateazaData(postare.publishedAt) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <h2 className="mt-6 font-scris text-3xl leading-[1.2] tracking-tight sm:text-[2.125rem]">
        <Link
          href={`/postari/${postare.slug}`}
          className="decoration-liniatura-tare underline-offset-[6px] hover:underline"
        >
          {postare.title}
        </Link>
      </h2>

      <p className="scris mt-4 max-w-lectura">{postare.previzualizare}</p>

      {/* Apare DOAR daca textul chiar continua. Altfel linkul ar promite ceva
          ce nu exista, iar utilizatorul nu ar mai avea incredere in el. */}
      {postare.trunchiat ? (
        <Link
          href={`/postari/${postare.slug}`}
          className="mt-4 inline-block rounded-mic text-sm font-medium text-stilou underline decoration-stilou/35 underline-offset-4 transition-colors hover:decoration-stilou"
        >
          Citește mai mult
        </Link>
      ) : null}
    </article>
  );
}

function StarePustie({ tagline }: { tagline?: string | null }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-6 sm:py-24">
      <h1 className="font-scris text-4xl leading-tight tracking-tight sm:text-5xl">
        Încă nu este publicat niciun text
      </h1>
      <p className="mt-5 max-w-lectura font-scris text-lg leading-relaxed text-cerneala-slaba">
        {tagline ??
          "Aici vor apărea compunerile și lucrările elevilor, după ce sunt citite și aprobate de doamna profesoară."}
      </p>
      <Link
        href="/trimite"
        className="mt-9 inline-block rounded-mediu bg-cerneala px-5 py-3 text-sm font-medium text-hartie transition-opacity hover:opacity-88"
      >
        Trimite primul text
      </Link>
    </main>
  );
}
