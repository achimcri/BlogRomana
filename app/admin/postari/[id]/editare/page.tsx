import { notFound } from "next/navigation";

import { PostEditor } from "@/components/admin/PostEditor";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditarePostare({
  params,
}: PageProps<"/admin/postari/[id]/editare">) {
  const { id } = await params;
  const postare = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentHtml: true,
      status: true,
      authorType: true,
      studentFirstName: true,
      studentLastName: true,
      studentClass: true,
    },
  });

  if (!postare) notFound();

  return (
    <div>
      <h1 className="font-scris text-3xl">Editează</h1>
      {postare.authorType === "STUDENT" ? (
        <p className="mt-2 text-sm text-cerneala-slaba">
          Text trimis de {postare.studentFirstName} {postare.studentLastName}
          {postare.studentClass ? `, ${postare.studentClass}` : ""}
        </p>
      ) : null}
      <div className="mt-8">
        <PostEditor postare={postare} />
      </div>
    </div>
  );
}
