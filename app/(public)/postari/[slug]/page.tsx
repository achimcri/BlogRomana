import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { sanitizeazaContinut } from "@/lib/sanitize";
import {
  autorPublic,
  formateazaData,
  gasestePostarePublicata,
  slugsPublicate,
} from "@/lib/posts";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await slugsPublicate();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/postari/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const postare = await gasestePostarePublicata(slug);
  if (!postare) return { title: "Text negăsit" };

  return {
    title: postare.title,
    description: postare.excerpt ?? undefined,
    openGraph: {
      title: postare.title,
      description: postare.excerpt ?? undefined,
      type: "article",
      publishedTime: postare.publishedAt?.toISOString(),
      images: postare.images[0] ? [postare.images[0].url] : undefined,
    },
  };
}

export default async function PaginaPostare({
  params,
}: PageProps<"/postari/[slug]">) {
  const { slug } = await params;
  const postare = await gasestePostarePublicata(slug);

  // Acopera si cazul in care textul exista dar nu e publicat: filtrul de status
  // este in gasestePostarePublicata, deci un link ghicit nu dezvaluie nimic.
  if (!postare) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <article>
        <header className="border-b border-liniatura pb-9">
          <h1 className="font-scris text-[2.5rem] leading-[1.1] tracking-tight sm:text-[3rem]">
            {postare.title}
          </h1>
          <div className="mt-8 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stilou-deschis font-scris text-lg font-semibold text-stilou"
            >
              {autorPublic(postare).trim().charAt(0).toUpperCase()}
            </span>
            <div className="text-sm leading-snug">
              <p className="font-medium text-cerneala">
                {autorPublic(postare)}
              </p>
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
        </header>

        {/* Sanitizam A DOUA oara, la randare.
            Continutul e deja curatat la salvare, dar sanitizarea la scriere
            "ingheata" politica din momentul salvarii: un rand scris sub o
            regula mai permisiva ar ramane asa in baza de date pentru totdeauna.
            Repetand aici, politica actuala se aplica intotdeauna. Costul e
            neglijabil, pentru ca pagina e randata rar (ISR). */}
        <div
          className="scris mt-10 max-w-lectura"
          dangerouslySetInnerHTML={{
            __html: sanitizeazaContinut(postare.contentHtml),
          }}
        />

        {postare.images.length > 0 ? (
          <section className="mt-12 max-w-lectura">
            {postare.images.map((imagine) => (
              <figure key={imagine.id} className="mt-8 first:mt-0">
                <Image
                  src={imagine.url}
                  alt={imagine.caption ?? `Poză din textul „${postare.title}”`}
                  width={imagine.width ?? 1600}
                  height={imagine.height ?? 1200}
                  className="h-auto w-full rounded-mediu"
                  sizes="(max-width: 768px) 100vw, 608px"
                />
                {imagine.caption ? (
                  <figcaption className="mt-2 text-sm text-cerneala-stinsa">
                    {imagine.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </section>
        ) : null}
      </article>

      <Link
        href="/"
        className="mt-20 inline-flex items-center gap-2 rounded-mediu border border-liniatura px-4 py-2.5 text-sm text-cerneala-slaba transition-colors hover:border-liniatura-tare hover:text-cerneala"
      >
        Toate textele
      </Link>
    </main>
  );
}
