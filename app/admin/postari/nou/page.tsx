import { PostEditor } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default function PostareNoua() {
  return (
    <div>
      <h1 className="font-scris text-3xl">Scrie o postare</h1>
      <div className="mt-8">
        <PostEditor />
      </div>
    </div>
  );
}
