import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/db";
import type { Role } from "@/lib/types";

/**
 * Cine are voie sa se logheze.
 *
 * Modelul de acces este intentionat restrictiv: elevii si vizitatorii nu au
 * conturi. Un cont necunoscut nu e doar lipsit de privilegii -- i se respinge
 * insusi login-ul.
 *
 * Doua liste:
 *   TEACHER_EMAILS -> rol TEACHER
 *   ADMIN_EMAILS   -> rol ADMIN
 *
 * ATENTIE: momentan cele doua roluri au EXACT aceleasi drepturi. Distinctia
 * exista ca sa fie stocata corect si ca sa putem restrange ulterior anumite
 * actiuni (stergere definitiva, setari) doar la ADMIN. Pana atunci, a pune pe
 * cineva in ADMIN_EMAILS nu ii da nimic in plus fata de TEACHER_EMAILS.
 */
function listaEmailuri(variabila: string): Set<string> {
  return new Set(
    (process.env[variabila] ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Rolul pentru un email, sau `null` daca nu are voie sa intre deloc. */
function rolPentru(email: string): Role | null {
  if (listaEmailuri("ADMIN_EMAILS").has(email)) return "ADMIN";
  if (listaEmailuri("TEACHER_EMAILS").has(email)) return "TEACHER";
  return null;
}

function existaCelPutinUnCont(): boolean {
  return (
    listaEmailuri("TEACHER_EMAILS").size > 0 ||
    listaEmailuri("ADMIN_EMAILS").size > 0
  );
}

/**
 * Google e configurat doar daca exista credentiale.
 *
 * Fara garda asta, aplicatia crapa la pornire cand AUTH_GOOGLE_ID lipseste --
 * ceea ce ar face imposibil de rulat local inainte sa configurezi OAuth.
 * Asa, partea publica a site-ului merge, iar pagina de autentificare spune
 * limpede ce lipseste.
 */
export const autentificareConfigurata = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: autentificareConfigurata ? [Google] : [],

  // Sesiuni in JWT, nu in baza de date. Doua motive:
  //  1. Paginile publice nu ating deloc baza de date pentru auth, deci Azure SQL
  //     serverless ramane pauzat (vezi nota despre cold start din plan).
  //  2. Nu avem nevoie de tabelele Account/Session/VerificationToken.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/autentificare",
    error: "/autentificare",
  },

  callbacks: {
    /**
     * Singurul loc unde se decide cine intra. Ruleaza inaintea crearii sesiunii.
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      if (!existaCelPutinUnCont()) {
        // Fail closed: variabile de mediu lipsa nu trebuie sa deschida adminul.
        console.error(
          "[auth] Nici TEACHER_EMAILS, nici ADMIN_EMAILS nu sunt setate -" +
            " orice login este respins.",
        );
        return false;
      }

      const rol = rolPentru(email);
      if (!rol) return false;

      // Contul exista in DB ca sa putem lega postarile de un autor si sa avem
      // un id stabil. Se creeaza la primul login reusit.
      //
      // Rolul se rescrie la FIECARE login: sursa de adevar sunt variabilele de
      // mediu, nu baza de date. Altfel, mutarea cuiva intre liste nu ar avea
      // efect asupra unui cont deja creat.
      await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: rol,
        },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: rol,
        },
      });

      return true;
    },

    async jwt({ token, user }) {
      // `user` e prezent doar la primul apel, imediat dupa login. Citim rolul
      // si id-ul o singura data si le purtam in token, ca sa nu interogam
      // baza de date la fiecare cerere.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role as Role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? "";
        session.user.role = (token.role as Role) ?? "TEACHER";
      }
      return session;
    },
  },
});

/**
 * Verificarea de autorizare folosita de paginile si actiunile de admin.
 * Arunca daca nu exista sesiune valida, deci apelantul nu poate uita sa
 * trateze cazul negativ.
 */
export async function requireTeacher() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("NEAUTENTIFICAT");
  }
  return session.user;
}
