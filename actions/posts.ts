"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { construiesteExtras, sanitizeazaContinut } from "@/lib/sanitize";
import { slugUnic } from "@/lib/slug";
import type { RezultatActiune } from "@/lib/types";
import { erori, schemaPostareProfesoara, schemaSetari } from "@/lib/validation";

async function ceruteDrepturi() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Neautentificat.");
  return session.user;
}

async function slugEsteFolosit(slug: string, exceptaId?: string) {
  const gasit = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });
  return gasit !== null && gasit.id !== exceptaId;
}

/** Creeaza o postare scrisa de profesoara. */
export async function creeazaPostare(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  const utilizator = await ceruteDrepturi();

  const verificat = schemaPostareProfesoara.safeParse({
    title: String(formData.get("title") ?? ""),
    contentHtml: String(formData.get("contentHtml") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
  });
  if (!verificat.success) return { ok: false, erori: erori(verificat.error) };

  const date = verificat.data;
  const htmlCurat = sanitizeazaContinut(date.contentHtml);
  const slug = await slugUnic(date.title, (s) => slugEsteFolosit(s));
  const publicata = date.status === "PUBLISHED";

  const creata = await prisma.post.create({
    data: {
      slug,
      title: date.title,
      contentHtml: htmlCurat,
      excerpt: construiesteExtras(htmlCurat),
      status: date.status,
      authorType: "TEACHER",
      authorUserId: utilizator.id || null,
      displayName: utilizator.name ?? "Doamna profesoară",
      publishedAt: publicata ? new Date() : null,
    },
    select: { id: true, slug: true },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: utilizator.email!,
      action: publicata ? "PUBLISH" : "CREATE",
      postId: creata.id,
      postTitle: date.title,
    },
  });

  revalidatePath("/");
  revalidatePath(`/postari/${creata.slug}`);
  revalidatePath("/admin/postari");

  redirect("/admin/postari");
}

/** Modifica o postare existenta (inclusiv o submisie in asteptare). */
export async function actualizeazaPostare(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  const utilizator = await ceruteDrepturi();
  const id = String(formData.get("id") ?? "");

  const existenta = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  if (!existenta) return { ok: false, mesajGeneral: "Postarea nu mai există." };

  const verificat = schemaPostareProfesoara.safeParse({
    title: String(formData.get("title") ?? ""),
    contentHtml: String(formData.get("contentHtml") ?? ""),
    status: String(formData.get("status") ?? existenta.status),
  });
  if (!verificat.success) return { ok: false, erori: erori(verificat.error) };

  const date = verificat.data;
  const htmlCurat = sanitizeazaContinut(date.contentHtml);
  const devinePublica =
    date.status === "PUBLISHED" && existenta.status !== "PUBLISHED";

  await prisma.post.update({
    where: { id },
    data: {
      title: date.title,
      contentHtml: htmlCurat,
      excerpt: construiesteExtras(htmlCurat),
      status: date.status,
      // Data publicarii se pune o singura data, la prima publicare.
      publishedAt: devinePublica
        ? new Date()
        : date.status === "PUBLISHED"
          ? existenta.publishedAt
          : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: utilizator.email!,
      action: devinePublica ? "PUBLISH" : "EDIT",
      postId: id,
      postTitle: date.title,
    },
  });

  revalidatePath("/");
  revalidatePath(`/postari/${existenta.slug}`);
  revalidatePath("/admin/postari");
  revalidatePath("/admin/asteptare");

  redirect("/admin/postari");
}

/** Sterge definitiv o postare. Logul de audit ramane. */
export async function stergePostare(formData: FormData): Promise<void> {
  const utilizator = await ceruteDrepturi();
  const id = String(formData.get("id") ?? "");

  const postare = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true },
  });
  if (!postare) return;

  // Pozele sunt sterse in cascada din baza de date (onDelete: Cascade).
  // TODO: la Faza 4 se sterg si fisierele din Blob Storage, altfel raman orfane.
  await prisma.post.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      actorEmail: utilizator.email!,
      action: "DELETE",
      postId: postare.id,
      postTitle: postare.title,
    },
  });

  revalidatePath("/");
  revalidatePath(`/postari/${postare.slug}`);
  revalidatePath("/admin/postari");
}

/** Scoate o postare de pe site, fara sa o stearga. */
export async function retragePostare(formData: FormData): Promise<void> {
  const utilizator = await ceruteDrepturi();
  const id = String(formData.get("id") ?? "");

  const postare = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, title: true },
  });
  if (!postare) return;

  await prisma.post.update({
    where: { id },
    data: { status: "DRAFT", publishedAt: null },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: utilizator.email!,
      action: "UNPUBLISH",
      postId: id,
      postTitle: postare.title,
    },
  });

  revalidatePath("/");
  revalidatePath(`/postari/${postare.slug}`);
  revalidatePath("/admin/postari");
}

export async function actualizeazaSetari(
  _stareAnterioara: RezultatActiune | null,
  formData: FormData,
): Promise<RezultatActiune> {
  await ceruteDrepturi();

  const verificat = schemaSetari.safeParse({
    siteTitle: String(formData.get("siteTitle") ?? ""),
    siteTagline: String(formData.get("siteTagline") ?? ""),
    aboutHtml: String(formData.get("aboutHtml") ?? ""),
  });
  if (!verificat.success) return { ok: false, erori: erori(verificat.error) };

  const date = verificat.data;
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      siteTitle: date.siteTitle,
      siteTagline: date.siteTagline || null,
      aboutHtml: date.aboutHtml ? sanitizeazaContinut(date.aboutHtml) : null,
    },
    create: {
      id: 1,
      siteTitle: date.siteTitle,
      siteTagline: date.siteTagline || null,
      aboutHtml: date.aboutHtml ? sanitizeazaContinut(date.aboutHtml) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/despre");

  return { ok: true, mesaj: "Setările au fost salvate." };
}
