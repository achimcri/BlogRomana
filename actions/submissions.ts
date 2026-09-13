"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import type { RezultatActiune } from "@/lib/types";
import { prisma } from "@/lib/db";
import { construiesteExtras, sanitizeazaContinut } from "@/lib/sanitize";
import { slugUnic } from "@/lib/slug";
import {
  erori,
  numePublicImplicit,
  schemaAprobare,
  schemaRespingere,
  schemaSubmisieElev,
} from "@/lib/validation";

async function slugEsteFolosit(slug: string): Promise<boolean> {
  const gasit = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });
  return gasit !== null;
}

/** Verifica sesiunea si arunca daca nu e profesoara. Folosit de toate actiunile de moderare. */
async function ceruteDrepturi() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Neautentificat.");
  }
  return session.user;
}

async function scrieAudit(
  actorEmail: string,
  action: string,
  postId: string,
  postTitle: string,
  details?: string,
) {
  await prisma.auditLog.create({
    data: { actorEmail, action, postId, postTitle, details: details ?? null },
  });
}

/**
 * Submisie publica, de la un elev. NU necesita autentificare -- e intentionat
 * deschisa, elevii nu au conturi.
 *
 * Postarea se creeaza mereu cu status PENDING. Nu exista cale prin care aceasta
 * actiune sa publice ceva direct.
 */
export async function trimitePostareElev(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  const brut = {
    title: String(formData.get("title") ?? ""),
    contentHtml: String(formData.get("contentHtml") ?? ""),
    studentFirstName: String(formData.get("studentFirstName") ?? ""),
    studentLastName: String(formData.get("studentLastName") ?? ""),
    studentClass: String(formData.get("studentClass") ?? ""),
    imageIds: formData.getAll("imageIds").map(String).filter(Boolean),
  };

  const verificat = schemaSubmisieElev.safeParse(brut);
  if (!verificat.success) {
    return { ok: false, erori: erori(verificat.error) };
  }
  const date = verificat.data;

  // Sanitizarea se face DUPA validare si inainte de orice scriere.
  const htmlCurat = sanitizeazaContinut(date.contentHtml);

  // Slug-ul se genereaza acum, dar postarea nu e vizibila pana la aprobare.
  const slug = await slugUnic(date.title, slugEsteFolosit);

  await prisma.post.create({
    data: {
      slug,
      title: date.title,
      contentHtml: htmlCurat,
      excerpt: construiesteExtras(htmlCurat),
      status: "PENDING",
      authorType: "STUDENT",
      studentFirstName: date.studentFirstName,
      studentLastName: date.studentLastName,
      studentClass: date.studentClass,
      // Ramane null pana cand profesoara decide, la aprobare, cum apare autorul.
      displayName: null,
    },
  });

  // Doar panoul de administrare se schimba; partea publica nu, pentru ca
  // textul inca nu e vizibil nicaieri.
  revalidatePath("/admin");
  revalidatePath("/admin/asteptare");

  return { ok: true };
}

/** Aproba si publica o submisie. Doar profesoara. */
export async function aprobaPostare(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  const utilizator = await ceruteDrepturi();

  const verificat = schemaAprobare.safeParse({
    postId: String(formData.get("postId") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });
  if (!verificat.success) {
    return { ok: false, erori: erori(verificat.error) };
  }

  const postare = await prisma.post.findUnique({
    where: { id: verificat.data.postId },
    select: { id: true, title: true, status: true },
  });
  if (!postare) {
    return { ok: false, mesajGeneral: "Textul nu mai există." };
  }
  if (postare.status === "PUBLISHED") {
    return { ok: false, mesajGeneral: "Textul este deja publicat." };
  }

  const actualizata = await prisma.post.update({
    where: { id: postare.id },
    data: {
      status: "PUBLISHED",
      displayName: verificat.data.displayName,
      publishedAt: new Date(),
      rejectionReason: null,
    },
    select: { slug: true },
  });

  await scrieAudit(
    utilizator.email!,
    "APPROVE",
    postare.id,
    postare.title,
    `Publicat ca „${verificat.data.displayName}”`,
  );

  revalidatePath("/");
  revalidatePath(`/postari/${actualizata.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/asteptare");

  return { ok: true, mesaj: "Text publicat." };
}

/** Respinge o submisie, cu motiv optional. Doar profesoara. */
export async function respingePostare(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  const utilizator = await ceruteDrepturi();

  const motivBrut = formData.get("rejectionReason");
  const verificat = schemaRespingere.safeParse({
    postId: String(formData.get("postId") ?? ""),
    rejectionReason: motivBrut ? String(motivBrut) : undefined,
  });
  if (!verificat.success) {
    return { ok: false, erori: erori(verificat.error) };
  }

  const postare = await prisma.post.findUnique({
    where: { id: verificat.data.postId },
    select: { id: true, title: true },
  });
  if (!postare) {
    return { ok: false, mesajGeneral: "Textul nu mai există." };
  }

  await prisma.post.update({
    where: { id: postare.id },
    data: {
      status: "REJECTED",
      rejectionReason: verificat.data.rejectionReason ?? null,
      publishedAt: null,
    },
  });

  await scrieAudit(
    utilizator.email!,
    "REJECT",
    postare.id,
    postare.title,
    verificat.data.rejectionReason,
  );

  revalidatePath("/admin");
  revalidatePath("/admin/asteptare");

  return { ok: true, mesaj: "Text respins." };
}

/** Numele public propus, folosit ca valoare initiala in formularul de aprobare. */
export async function propuneNumePublic(postId: string): Promise<string> {
  await ceruteDrepturi();
  const postare = await prisma.post.findUnique({
    where: { id: postId },
    select: { studentFirstName: true, studentLastName: true },
  });
  if (!postare?.studentFirstName || !postare.studentLastName) return "";
  return numePublicImplicit(postare.studentFirstName, postare.studentLastName);
}
