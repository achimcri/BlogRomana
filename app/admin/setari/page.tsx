import { SettingsForm } from "@/components/admin/SettingsForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Setari() {
  const setari = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <h1 className="font-scris text-3xl">Setări</h1>
      <div className="mt-8 max-w-lectura">
        <SettingsForm
          setari={{
            siteTitle: setari?.siteTitle ?? "Blog de Limba Română",
            siteTagline: setari?.siteTagline ?? "",
            aboutHtml: setari?.aboutHtml ?? "",
          }}
        />
      </div>
    </div>
  );
}
