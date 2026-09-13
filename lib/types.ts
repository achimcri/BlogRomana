// Tipurile stricte pentru coloanele care in schema Prisma sunt String.
// Motivul: SQL Server nu suporta `enum` in Prisma (vezi prisma/schema.prisma).
// Sursa de adevar pentru validare este lib/validation.ts, care foloseste
// exact aceste liste.

export const POST_STATUSES = [
  "DRAFT",
  "PENDING",
  "PUBLISHED",
  "REJECTED",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const AUTHOR_TYPES = ["TEACHER", "STUDENT"] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

export const ROLES = ["TEACHER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const AUDIT_ACTIONS = [
  "CREATE",
  "EDIT",
  "APPROVE",
  "REJECT",
  "DELETE",
  "PUBLISH",
  "UNPUBLISH",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Etichete in romana pentru interfata de administrare. */
export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Ciornă",
  PENDING: "În așteptare",
  PUBLISHED: "Publicată",
  REJECTED: "Respinsă",
};

/**
 * Rezultatul unei server action folosite cu useActionState.
 * Sta aici, si nu in actions/, pentru ca un fisier "use server" are voie sa
 * exporte doar functii async.
 */
export type RezultatActiune =
  | { ok: true; mesaj?: string }
  | { ok: false; mesajGeneral?: string; erori?: Record<string, string> };
