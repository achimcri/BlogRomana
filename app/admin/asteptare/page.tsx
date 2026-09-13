import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { prisma } from "@/lib/db";
import { formateazaData } from "@/lib/posts";
import { sanitizeazaContinut } from "@/lib/sanitize";
import { numePublicImplicit } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function CoadaDeAprobare() {
  const inAsteptare = await prisma.post.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" }, // cele mai vechi primele
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (inAsteptare.length === 0) {
    return (
      <div>
        <h1 className="font-scris text-3xl">În așteptare</h1>
        <p className="mt-4 text-cerneala-slaba">
          Nu așteaptă niciun text. Când un elev trimite ceva, apare aici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-scris text-3xl">
        {inAsteptare.length === 1
          ? "Un text în așteptare"
          : `${inAsteptare.length} texte în așteptare`}
      </h1>

      <div className="mt-8 space-y-10">
        {inAsteptare.map((postare) => (
          <article
            key={postare.id}
            className="border-l-2 border-pix bg-hartie py-1 pl-6"
          >
            <header>
              <h2 className="font-scris text-2xl leading-snug">
                {postare.title}
              </h2>
              {/* Numele complet se vede doar aici, in admin. Pe site apare
                  forma scurta aleasa mai jos. */}
              <p className="mt-2 text-sm text-cerneala-slaba">
                {postare.studentFirstName} {postare.studentLastName}
                {postare.studentClass ? `, ${postare.studentClass}` : ""}
              </p>
              <p className="mt-0.5 text-sm text-cerneala-stinsa">
                Trimis {formateazaData(postare.submittedAt)}
              </p>
            </header>

            <div
              className="scris mt-6 max-w-lectura"
              dangerouslySetInnerHTML={{
                __html: sanitizeazaContinut(postare.contentHtml),
              }}
            />

            {postare.images.length > 0 ? (
              <p className="mt-4 text-sm text-cerneala-stinsa">
                {postare.images.length}{" "}
                {postare.images.length === 1 ? "poză atașată" : "poze atașate"}
              </p>
            ) : null}

            <ApprovalActions
              postId={postare.id}
              numePublicPropus={numePublicImplicit(
                postare.studentFirstName ?? "",
                postare.studentLastName ?? "",
              )}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
