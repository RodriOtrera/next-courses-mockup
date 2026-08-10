"use client";

import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createEbookAction } from "@/lib/db/actions/products_actions";
import { useState } from "react";
import CardUI from "../_components/CardUI";
import { KeysOfCardColors, cardColors } from "../_components/cardColors";
import { SelectEbook } from "@/lib/db/schema/ebook_schema";
import { cn } from "@/lib/utils";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "@/components/uploaders/UploadButton";
import { CheckIcon } from "lucide-react";

export type ProductAction = "update" | "create";

const inputStyles =
  "w-full rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-red-500/50 transition-colors";

const sectionStyles =
  "rounded-xl border border-neutral-800 bg-[#141414] p-6 space-y-4";

const labelStyles =
  "text-xs font-medium uppercase tracking-wider text-neutral-500";

const AdminEditor = ({ ebook }: { ebook?: SelectEbook }) => {
  const [colorSelected, setColorSelected] = useState<KeysOfCardColors>(
    ebook ? (ebook.card_color as KeysOfCardColors) : "red"
  );
  const [title, setTitle] = useState(ebook ? ebook.title : "");
  const [description, setDescription] = useState(
    ebook ? ebook.description : ""
  );
  const [precio, setPrecio] = useState(ebook ? ebook.price : 0);
  const [precioUsd, setPrecioUsd] = useState(ebook ? ebook.price_usd : 0);
  const [statsNames, setStatsNames] = useState(
    ebook ? ebook.stats_names : { stat1: "", stat2: "", stat3: "" }
  );
  const [statsValues, setStatsValues] = useState(
    ebook ? ebook.stats_values : { stat1: 0, stat2: 0, stat3: 0 }
  );

  const [selectedImage, setImage] = useState<File>();
  const [imgUrl, setImgUrl] = useState<string | undefined>(
    ebook ? ebook.img_url : undefined
  );
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(
    ebook ? ebook.pdf_url : undefined
  );

  const { control: imageControl } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });
  const { control: pdfControl } = useUploadFile({
    route: "pdfUploader",
    api: "/api/upload",
  });

  const statKeys = ["stat1", "stat2", "stat3"] as const;

  return (
    <form action={createEbookAction} className="space-y-8">
      <input
        hidden
        defaultValue={ebook ? "update" : "create"}
        name="action_type"
      />
      <input
        hidden
        defaultValue={ebook ? ebook.id : undefined}
        name="ebook_id"
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Live Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start shrink-0">
          <p className={cn(labelStyles, "mb-4")}>Vista Previa</p>
          <CardUI
            action={() => {}}
            canBeOpen={false}
            pdf_url=""
            id=""
            price={precio}
            description={description}
            stats_values={{
              stat1: statsValues.stat1,
              stat2: statsValues.stat2,
              stat3: statsValues.stat3,
            }}
            card_color={colorSelected}
            stats_names={{
              stat1: statsNames.stat1,
              stat2: statsNames.stat2,
              stat3: statsNames.stat3,
            }}
            title={title}
            img_url={
              selectedImage
                ? URL.createObjectURL(selectedImage)
                : ebook
                ? ebook.img_url
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
                placeholder="Nombre del ebook"
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
                placeholder="Describe el contenido del ebook..."
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-red-500/50 transition-colors min-h-[100px]"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 mb-2 block">
                Color de tarjeta
              </label>
              <div className="flex gap-3">
                {Object.keys(cardColors).map((color) => (
                  <button
                    type="button"
                    onClick={() => setColorSelected(color as KeysOfCardColors)}
                    key={color}
                    className={cn(
                      "h-9 w-9 rounded-full transition-all flex items-center justify-center",
                      colorSelected === color
                        ? "ring-2 ring-offset-2 ring-offset-[#141414]"
                        : "hover:scale-110"
                    )}
                    style={{
                      backgroundColor:
                        cardColors[color as KeysOfCardColors].primaryColor,
                      ...(colorSelected === color
                        ? {
                            ["--tw-ring-color" as string]:
                              cardColors[color as KeysOfCardColors]
                                .primaryColor,
                          }
                        : {}),
                    }}
                  >
                    {colorSelected === color && (
                      <CheckIcon className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <input type="hidden" value={colorSelected} name="cardColor" />
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

          {/* Section 3: Estadisticas */}
          <section className={sectionStyles}>
            <h3 className={labelStyles}>Estadisticas</h3>

            <div className="space-y-5">
              {statKeys.map((key, index) => (
                <div key={key}>
                  {index > 0 && <div className="h-px bg-neutral-800 mb-5" />}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        onChange={(e) =>
                          setStatsNames((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        value={statsNames[key]}
                        name={key}
                        placeholder={`Nombre estadistica ${index + 1}`}
                        className={cn(inputStyles, "flex-1")}
                        type="text"
                      />
                      <span className="min-w-[3rem] text-center text-sm font-mono font-semibold text-red-400 bg-red-500/10 rounded-lg px-2.5 py-2">
                        {statsValues[key]}
                      </span>
                    </div>

                    <div className="px-1">
                      <Slider
                        name={`value${index + 1}`}
                        min={0}
                        max={100}
                        value={[statsValues[key]]}
                        onValueChange={(val) =>
                          setStatsValues((prev) => ({
                            ...prev,
                            [key]: val[0] as number,
                          }))
                        }
                        className="py-1.5 [&_[data-radix-slider-range]]:bg-red-500 [&_[data-radix-slider-thumb]]:border-red-500 [&_[data-radix-slider-thumb]]:bg-neutral-900"
                      />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-neutral-600">0</span>
                        <span className="text-[10px] text-neutral-600">
                          100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Archivos */}
          <section className={sectionStyles}>
            <h3 className={labelStyles}>Archivos</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block">
                  Imagen de portada
                </label>
                <div className="flex items-center gap-3">
                  <input
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImage(e.target.files[0]);
                      }
                    }}
                    id="upload-photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    className="text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-xs file:text-neutral-300 file:cursor-pointer hover:file:bg-neutral-700"
                  />
                </div>
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
          {(ebook || (imgUrl && pdfUrl)) && (
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-medium"
            >
              {ebook ? "Actualizar Ebook" : "Crear Ebook"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default AdminEditor;
