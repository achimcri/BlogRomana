import type { Metadata } from "next";
import Link from "next/link";

import { autentificareConfigurata, signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Autentificare",
  robots: { index: false, follow: false },
};

export default async function PaginaAutentificare({
  searchParams,
}: PageProps<"/autentificare">) {
  const params = await searchParams;
  const eroare = typeof params.error === "string" ? params.error : null;
  const redirectCatre =
    typeof params.redirect === "string" && params.redirect.startsWith("/admin")
      ? params.redirect
      : "/admin";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <h1 className="font-scris text-3xl leading-tight">
          Administrare
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cerneala-slaba">
          Intră cu contul Google al doamnei profesoare pentru a publica,
          edita și aproba texte.
        </p>

        {eroare ? (
          <div className="mt-6 border-l-2 border-pix bg-pix-deschis px-4 py-3 text-sm leading-relaxed">
            {eroare === "AccessDenied" ? (
              <>
                <p className="font-medium text-pix">Cont neautorizat</p>
                <p className="mt-1 text-cerneala-slaba">
                  Contul cu care ai încercat nu are drepturi pe acest site.
                  Intră cu contul doamnei profesoare.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-pix">Autentificarea nu a reușit</p>
                <p className="mt-1 text-cerneala-slaba">
                  Încearcă din nou. Dacă problema se repetă, verifică setările
                  contului Google.
                </p>
              </>
            )}
          </div>
        ) : null}

        {autentificareConfigurata ? (
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: redirectCatre });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 border border-cerneala bg-cerneala px-5 py-3 text-sm font-medium text-hartie transition-opacity hover:opacity-90"
            >
              <GoogleG />
              Intră cu Google
            </button>
          </form>
        ) : (
          <div className="mt-8 border-l-2 border-asteptare bg-asteptare-deschis px-4 py-3 text-sm leading-relaxed">
            <p className="font-medium text-asteptare">
              Login-ul Google nu este configurat
            </p>
            <p className="mt-1 text-cerneala-slaba">
              Completează <code>AUTH_GOOGLE_ID</code> și{" "}
              <code>AUTH_GOOGLE_SECRET</code> în fișierul <code>.env</code>,
              apoi repornește. Pașii sunt în README.
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-stilou underline underline-offset-4"
        >
          Înapoi la blog
        </Link>
      </div>
    </main>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="currentColor"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        opacity=".8"
      />
      <path
        fill="currentColor"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        opacity=".6"
      />
      <path
        fill="currentColor"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        opacity=".9"
      />
    </svg>
  );
}
