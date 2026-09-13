import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16, `middleware.ts` se numeste `proxy.ts`. Functionalitatea e aceeasi.
//
// ATENTIE: asta NU este autorizare. Verificam doar daca EXISTA un cookie de
// sesiune, fara sa-i validam semnatura si fara sa atingem baza de date --
// documentatia Next.js numeste asta "optimistic check" si avertizeaza explicit
// sa nu folosesti proxy-ul ca solutie de autorizare.
//
// Rolul lui aici e doar UX: sa trimita un vizitator nelogat direct la pagina de
// autentificare, in loc sa randeze adminul si abia apoi sa redirecteze.
// Verificarea reala, care conteaza, este `requireTeacher()` din
// app/admin/layout.tsx si din fiecare server action.

const SESSION_COOKIES = [
  "authjs.session-token", // http, dezvoltare locala
  "__Secure-authjs.session-token", // https, productie
];

export function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSessionCookie) {
    const loginUrl = new URL("/autentificare", request.url);
    // Ca sa-l ducem inapoi unde voia sa ajunga, dupa login.
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
