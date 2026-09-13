import type { Metadata } from "next";

import { sanitizeazaContinut } from "@/lib/sanitize";
import { citesteSetari } from "@/lib/posts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const setari = await citesteSetari();
  return { title: "Despre", description: setari?.siteTagline ?? undefined };
}

export default async function PaginaDespre() {
  const setari = await citesteSetari();

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-scris text-4xl leading-tight">Despre acest blog</h1>
      {setari?.aboutHtml ? (
        <div
          className="scris mt-8 max-w-lectura"
          dangerouslySetInnerHTML={{
            __html: sanitizeazaContinut(setari.aboutHtml),
          }}
        />
      ) : (
        <p className="mt-8 max-w-lectura font-scris text-lg leading-relaxed text-cerneala-slaba">
          Aici publicăm compuneri și lucrări ale elevilor.
        </p>
      )}
    </main>
  );
}
