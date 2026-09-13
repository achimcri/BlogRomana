import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Adminul nu se cacheaza niciodata si nu se prerandeaza.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // ASTA este autorizarea reala. proxy.ts face doar o verificare optimista de
  // cookie, pentru UX; nu te baza pe el.
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/autentificare");
  }

  const inAsteptare = await prisma.post.count({ where: { status: "PENDING" } });

  return (
    <div className="flex min-h-full flex-col">
      {/* Bara de admin poarta rosul pixului: semnaleaza ca esti in modul
          "corectare", nu pe partea publica a site-ului. */}
      <header className="border-b-2 border-pix bg-hartie">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/admin" className="font-scris text-lg font-semibold">
            Administrare
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <LinkAdmin href="/admin/postari">Postări</LinkAdmin>
            <LinkAdmin href="/admin/asteptare">
              În așteptare
              {inAsteptare > 0 ? (
                <span className="ml-1.5 inline-flex min-w-5 justify-center rounded-full bg-pix px-1.5 py-0.5 text-xs font-medium text-hartie">
                  {inAsteptare}
                </span>
              ) : null}
            </LinkAdmin>
            <LinkAdmin href="/admin/setari">Setări</LinkAdmin>
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-cerneala-slaba underline underline-offset-4 hover:text-cerneala"
            >
              Vezi blogul
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-cerneala-slaba underline underline-offset-4 hover:text-cerneala"
              >
                Ieși
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}

function LinkAdmin({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-cerneala-slaba transition-colors hover:text-cerneala"
    >
      {children}
    </Link>
  );
}
