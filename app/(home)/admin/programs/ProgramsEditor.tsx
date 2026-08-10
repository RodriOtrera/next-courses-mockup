"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createProgramAction } from "@/lib/db/actions/products_actions";
import { SelectProgram } from "@/lib/db/schema/program_schema";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "@/components/uploaders/UploadButton";
import { useState } from "react";
import Program from "../../productos/Program";
import { cn } from "@/lib/utils";

const inputStyles =
  "w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-red-500/50 transition-colors";

const sectionStyles =
  "rounded-xl border border-neutral-800 bg-[#141414] p-6 space-y-4";

const labelStyles =
  "text-xs font-medium uppercase tracking-wider text-neutral-500";

const ProgramsAdminEditor = ({ program }: { program?: SelectProgram }) => {
  const [title, setTitle] = useState(program ? program.title : "");
  const [description, setDescription] = useState(
    program ? program.description : ""
  );
  const [precio, setPrecio] = useState(program ? program.price : 0);
  const [precioUsd, setPrecioUsd] = useState(program ? program.price_usd : 0);

  const [selectedImage, setImage] = useState<File>();
  const [imgUrl, setImgUrl] = useState<string | undefined>(
    program ? program.img_url : undefined
  );
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(
    program ? program.pdf_url : undefined
  );

  const { control: imageControl } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });
  const { control: pdfControl } = useUploadFile({
    route: "pdfUploader",
    api: "/api/upload",
  });

  return (
    <form action={createProgramAction} className="space-y-8">
      <input
        hidden
        defaultValue={program ? "update" : "create"}
        name="action_type"
      />
      <input
        hidden
        defaultValue={program ? program.id : undefined}
        name="program_id"
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Live Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start shrink-0 w-full lg:w-[340px]">
          <p className={cn(labelStyles, "mb-4")}>Vista Previa</p>
          <Program
            pdf_url=""
            action={() => {}}
            price={precio}
            title={title}
            description={description}
            id=""
            img_url={
              selectedImage
                ? URL.createObjectURL(selectedImage)
                : program
                ? program.img_url
                : undefined
            }
          />
        </div>

        {/* Right: Form Fields */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Section 1: Info General */}
          <section className={sectionStyles}>
            <h3 className={labelStyles}>Informacion General</h3>

            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block">
                Titulo
              </label>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                name="title"
                placeholder="Nombre del programa"
                className={inputStyles}
                type="text"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block">
                Descripcion
              </label>
              <Textarea
                value={description}
                name="description"
                placeholder="Describe el contenido del programa..."
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-red-500/50 transition-colors min-h-[100px]"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          {/* Section 2: Precios */}
          <section className={sectionStyles}>
            <h3 className={labelStyles}>Precios</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Precio ARS
                </label>
                <input
                  onChange={(e) => setPrecio(parseInt(e.target.value) || 0)}
                  value={precio.toString()}
                  placeholder="0"
                  name="price"
                  className={inputStyles}
                  type="number"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Precio USD
                </label>
                <input
                  onChange={(e) => setPrecioUsd(parseInt(e.target.value) || 0)}
                  value={precioUsd.toString()}
                  placeholder="0"
                  name="price_usd"
                  className={inputStyles}
                  type="number"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Archivos */}
          <section className={sectionStyles}>
            <h3 className={labelStyles}>Archivos</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Imagen de portada
                </label>
                <input
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setImage(e.target.files[0]);
                    }
                  }}
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-xs file:text-neutral-300 file:cursor-pointer hover:file:bg-neutral-700"
                />
                <UploadButton
                  control={imageControl}
                  label="Subir imagen"
                  onUploadComplete={(url) => setImgUrl(url)}
                />
                <input type="hidden" value={imgUrl ?? ""} name="img_url" />
                {imgUrl && (
                  <p className="text-[11px] text-green-500 mt-1.5">
                    Imagen cargada correctamente
                  </p>
                )}
              </div>

              <div className="h-px bg-neutral-800" />

              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Archivo PDF
                </label>
                <UploadButton
                  control={pdfControl}
                  accept="application/pdf"
                  label="Subir PDF"
                  onUploadComplete={(url) => setPdfUrl(url)}
                />
                <input type="hidden" value={pdfUrl ?? ""} name="pdf_url" />
                {pdfUrl && (
                  <p className="text-[11px] text-green-500 mt-1.5">
                    PDF cargado correctamente
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          {(program || (imgUrl && pdfUrl)) && (
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-medium"
            >
              {program ? "Actualizar Programa" : "Crear Programa"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProgramsAdminEditor;
