import DiplomaComponent from "@/components/certification/DiplomaComponent";
import { getCertificate } from "@/lib/db/actions/courses/certifications";
import { checkTestimony } from "@/lib/db/actions/testimony";

import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Certificado");

export type Certificate = AwaitedReturn<typeof getCertificate>;

export default async function Certificado(props: PageParams<{ id: string }>) {
  const { id } = await props.params;
  const certificado = await getCertificate(id);
  if (certificado == undefined) {
    return (
      <div className="h-screen flex justify-end items-center">
        El certificado no existe
      </div>
    );
  }
  const testimony = await checkTestimony(certificado.course_id);

  return (
    <DiplomaComponent
      certificate={certificado}
      canCreate={testimony == undefined}
    />
  );
}
