import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";
import { citesteSetari } from "@/lib/posts";

export default async function LayoutPublic({ children }: LayoutProps<"/">) {
  const setari = await citesteSetari();
  const titlu = setari?.siteTitle ?? "Blog de Limba Română";

  return (
    <>
      {/* Antetul ramane la vedere la derulare -- pe un text lung de compunere,
          intoarcerea la lista nu trebuie sa ceara derulare pana sus. */}
      <header className="sticky top-0 z-20 border-b border-liniatura bg-hartie/85 backdrop-blur-md">
        {/* `flex-wrap` nu e decorativ: titlul vine din setari si poate fi oricat
            de lung. Fara rupere pe randuri, pe telefon ar impinge navigatia in
            afara ecranului si ar face toata pagina sa derulaze orizontal. */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="font-scris text-base font-semibold tracking-tight sm:text-lg"
          >
            {titlu}
          </Link>

          <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
            <Link
              href="/despre"
              className="rounded-mediu px-2.5 py-2 text-cerneala-slaba transition-colors hover:bg-hartie-umbra hover:text-cerneala sm:px-3"
            >
              Despre
            </Link>
            <Link
              href="/trimite"
              className="rounded-mediu bg-cerneala px-3.5 py-2 font-medium text-hartie transition-opacity hover:opacity-88 sm:px-4"
            >
              Trimite un text
            </Link>
            <span
              className="mx-1 hidden h-5 w-px bg-liniatura sm:block"
              aria-hidden="true"
            />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-24 border-t border-liniatura bg-suprafata">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm leading-relaxed text-cerneala-stinsa">
            Textele aparțin elevilor și sunt publicate cu acordul doamnei
            profesoare.
          </p>
        </div>
      </footer>
    </>
  );
}
