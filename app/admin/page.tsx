import Link from "next/link";

import { prisma } from "@/lib/db";
import { formateazaData } from "@/lib/posts";

export default async function PanouAdmin() {
  const [inAsteptare, publicate, ciorne, respinse, ultimele] = await Promise.all(
    [
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.post.count({ where: { status: "REJECTED" } }),
      prisma.post.findMany({
        where: { status: "PENDING" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          studentFirstName: true,
          studentLastName: true,
          studentClass: true,
          submittedAt: true,
        },
      }),
    ],
  );

  return (
    <div>
      {/* Coada de aprobare e singurul lucru care cere actiune, deci e primul
          lucru pe pagina -- nu un rand de statistici. */}
      {inAsteptare > 0 ? (
        <section className="border-l-2 border-pix bg-pix-deschis px-5 py-4">
          <h1 className="font-scris text-2xl">
            {inAsteptare === 1
              ? "Un text așteaptă să fie citit"
              : `${inAsteptare} texte așteaptă să fie citite`}
          </h1>
          <ul className="mt-4 space-y-2 text-sm">
            {ultimele.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{p.title}</span>
                <span className="text-cerneala-slaba">
                  {p.studentFirstName} {p.studentLastName}
                  {p.studentClass ? `, ${p.studentClass}` : ""}
                </span>
                <span className="text-cerneala-stinsa">
                  {formateazaData(p.submittedAt)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/asteptare"
            className="mt-4 inline-block border border-pix bg-pix px-4 py-2 text-sm font-medium text-hartie transition-opacity hover:opacity-90"
          >
            Deschide coada
          </Link>
        </section>
      ) : (
        <section className="border-l-2 border-liniatura px-5 py-4">
          <h1 className="font-scris text-2xl">Nu așteaptă niciun text</h1>
          <p className="mt-2 text-sm text-cerneala-slaba">
            Când un elev trimite un text, apare aici.
          </p>
        </section>
      )}

      <div className="mt-10 grid gap-px border border-liniatura bg-liniatura sm:grid-cols-3">
        <Cifra eticheta="Publicate" valoare={publicate} />
        <Cifra eticheta="Ciorne" valoare={ciorne} />
        <Cifra eticheta="Respinse" valoare={respinse} />
      </div>

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link
          href="/admin/postari/nou"
          className="border border-cerneala bg-cerneala px-4 py-2 font-medium text-hartie transition-opacity hover:opacity-90"
        >
          Scrie o postare
        </Link>
        <Link
          href="/admin/postari"
          className="border border-liniatura px-4 py-2 transition-colors hover:border-cerneala"
        >
          Toate postările
        </Link>
      </div>
    </div>
  );
}

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: number }) {
  return (
    <div className="bg-hartie px-5 py-4">
      <p className="font-scris text-3xl">{valoare}</p>
      <p className="mt-1 text-sm text-cerneala-slaba">{eticheta}</p>
    </div>
  );
}
