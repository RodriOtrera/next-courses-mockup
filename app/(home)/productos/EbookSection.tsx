import { deleteEbookAction, getEbooks } from "@/lib/db/actions/products_actions";
import { TitleOfProduts } from "../_components/TitleOfProducts";
import CardUI from "../_components/CardUI";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import Link from "next/link";

export default async function EbookSection({ isAdmin }: { isAdmin: boolean }) {
  const ebooks = await getEbooks();

  return (
    <div className="flex flex-col min-h-screen">
      <TitleOfProduts
        title="Ebooks"
        content="LOS EBOOKS SON LIBROS DIGITALES CON TODOS LOS CONOCIMIENTOS NECESARIOS PARA
        LOGRAR OBTENER TUS OBJETIVOS DENTRO DE LA CALISTENIA"
      />
      <div className=" flex flex-wrap justify-center">
        {ebooks.map((e) => (
          <div className="flex flex-col items-center" key={e.id}>
            <CardUI key={e.id} {...e} action={() => {}} />
            {isAdmin && (
              <div className="flex flex-col items-center">
                <Link href={`/admin?ebookId=${e.id}`} className=" ">
                  <Button className="mb-4" variant="outline">
                    <Edit className="mr-2" />
                    Editar
                  </Button>
                </Link>
                <form action={deleteEbookAction}>
                  <input type="hidden" name="ebook_id" value={e.id} />
                  <Button className="mb-4" variant="outline">
                    <Trash className="mr-2" />
                    Eliminar
                  </Button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
