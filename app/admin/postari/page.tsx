import Link from "next/link";

import { retragePostare, stergePostare } from "@/actions/posts";
import { prisma } from "@/lib/db";
import { formateazaData } from "@/lib/posts";
import { POST_STATUS_LABELS, type PostStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ToatePostarile() {
  const postari = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      authorType: true,
      displayName: true,
      studentClass: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-scris text-3xl">Postări</h1>
        <Link
          href="/admin/postari/nou"
          className="border border-cerneala bg-cerneala px-4 py-2 text-sm font-medium text-hartie transition-opacity hover:opacity-90"
        >
          Scrie o postare
        </Link>
      </div>

      {postari.length === 0 ? (
        <p className="mt-8 text-cerneala-slaba">
          Nu există nicio postare încă.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-liniatura border-y border-liniatura">
          {postari.map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-scris text-lg leading-snug">{p.title}</p>
                <p className="mt-0.5 text-sm text-cerneala-stinsa">
                  {p.displayName ?? "Autor nestabilit"}
                  {p.studentClass ? `, ${p.studentClass}` : ""}
                  {p.publishedAt ? ` — ${formateazaData(p.publishedAt)}` : ""}
                </p>
              </div>

              <Eticheta status={p.status as PostStatus} />

              <div className="flex items-center gap-3 text-sm">
                {p.status === "PUBLISHED" ? (
                  <Link
                    href={`/postari/${p.slug}`}
                    className="text-stilou underline underline-offset-4"
                  >
                    Vezi
                  </Link>
                ) : null}
                <Link
                  href={`/admin/postari/${p.id}/editare`}
                  className="underline underline-offset-4"
                >
                  Editează
                </Link>
                {p.status === "PUBLISHED" ? (
                  <form action={retragePostare}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="underline underline-offset-4">
                      Retrage
                    </button>
                  </form>
                ) : null}
                <form action={stergePostare}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="text-pix underline underline-offset-4"
                  >
                    Șterge
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Eticheta({ status }: { status: PostStatus }) {
  const stiluri: Record<PostStatus, string> = {
    PUBLISHED: "border-liniatura text-cerneala-slaba",
    PENDING: "border-asteptare bg-asteptare-deschis text-asteptare",
    DRAFT: "border-liniatura text-cerneala-stinsa",
    REJECTED: "border-pix text-pix",
  };
  return (
    <span className={`border px-2 py-0.5 text-xs ${stiluri[status]}`}>
      {POST_STATUS_LABELS[status]}
    </span>
  );
}
