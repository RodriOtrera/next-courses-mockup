"use client";
import React, { useState, useRef } from "react";

import { ModuleDB } from "@/lib/db/schema/modules";
import { ModuleEnums, moduleValues } from "../../lib/db/schema/modules_items";
import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "../uploaders/UploadButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { crearModuleItem } from "@/lib/db/actions/edit/modules_actions";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MuxVideoUpload } from "@/components/mux/MuxVideoUpload";
import { DialogClose, DialogTrigger } from "@radix-ui/react-dialog";
import { CaptionLanguagePicker } from "@/components/mux/CaptionLanguagePicker";
import { AUTO_LANGUAGE } from "@/lib/mux/caption_languages";
import { Sparkles } from "lucide-react";
import Image from "next/image";

const ModuleModal = ({ module }: { module: ModuleDB }) => {
  const [moduleType, setModuleType] = useState<ModuleEnums>("video");
  const [pdfUrl, setpdfUrl] = useState<string | undefined>(undefined);
  const [videoSource, setVideoSource] = useState<"youtube" | "mux">("youtube");
  const [muxData, setMuxData] = useState<{
    assetId: string;
    playbackId: string;
  } | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState(AUTO_LANGUAGE);
  const [captionTargets, setCaptionTargets] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  const { control: pdfControl } = useUploadFile({
    route: "pdfUploader",
    api: "/api/upload",
  });

  const thumbnailUrl = muxData
    ? `https://image.mux.com/${muxData.playbackId}/thumbnail.jpg?time=5&width=320&height=180`
    : null;

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className=" mt-2 px-4 font-bold text-sm py-2"
            variant="outline"
          >
            Crear Item de modulo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={crearModuleItem} className="flex flex-col gap-2">
            <input hidden name="module_id" defaultValue={module.id} />
            <input hidden name="course_id" defaultValue={module.course_id} />
            <input type="hidden" readOnly value={pdfUrl ?? ""} name="pdf_url" />

            <DialogHeader className="flex flex-col gap-1">
              <DialogTitle>Nuevo Capitulo de Modulo</DialogTitle>
            </DialogHeader>
            <Input
              ref={titleRef}
              name="title"
              placeholder="Nombre del modulo"
            />
            <Select
              onValueChange={(value) => {
                setModuleType(value as ModuleEnums);
              }}
              value={moduleType}
              name="module_type"
            >
              {" "}
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de modulo" />
              </SelectTrigger>
              <SelectContent>
                {moduleValues.map((e) => (
                  <SelectItem
                    key={e}
                    value={e}
                    onClick={() => {
                      setModuleType(e);
                    }}
                  >
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {moduleType == "pdf" && (
              <>
                {pdfUrl != undefined ? (
                  <h1 className="pl-2 text-sm text-green-400 font-semibold">
                    PDF subido!
                  </h1>
                ) : (
                  <UploadButton
                    control={pdfControl}
                    accept="application/pdf"
                    label="SUBIR PDF"
                    onUploadComplete={(url) => setpdfUrl(url)}
                  />
                )}
              </>
            )}
            {moduleType == "video" && (
              <>
                <input
                  type="hidden"
                  name="mux_asset_id"
                  readOnly
                  value={muxData?.assetId ?? ""}
                />
                <input
                  type="hidden"
                  name="mux_playback_id"
                  readOnly
                  value={muxData?.playbackId ?? ""}
                />
                {/* The lesson row doesn't exist yet, so the caption choices
                    ride along with the form: `crearModuleItem` persists them
                    and seeds the track rows the pipeline runs off. */}
                <input
                  type="hidden"
                  name="caption_source_language"
                  readOnly
                  value={sourceLanguage}
                />
                <input
                  type="hidden"
                  name="caption_targets"
                  readOnly
                  value={captionTargets.join(",")}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={videoSource === "youtube" ? "default" : "outline"}
                    onClick={() => setVideoSource("youtube")}
                    size="sm"
                  >
                    YouTube
                  </Button>
                  <Button
                    type="button"
                    variant={videoSource === "mux" ? "default" : "outline"}
                    onClick={() => setVideoSource("mux")}
                    size="sm"
                  >
                    Subir Video
                  </Button>
                </div>
                {videoSource === "youtube" && (
                  <Input placeholder="Video url" type="url" name="video_url" />
                )}
                {videoSource === "mux" && (
                  <>
                    {!muxData && (
                      <CaptionLanguagePicker
                        idPrefix={`module-${module.id}`}
                        sourceLanguage={sourceLanguage}
                        onSourceChange={setSourceLanguage}
                        targets={captionTargets}
                        onToggleTarget={(code) =>
                          setCaptionTargets((prev) =>
                            prev.includes(code)
                              ? prev.filter((c) => c !== code)
                              : [...prev, code]
                          )
                        }
                      />
                    )}
                    <MuxVideoUpload
                      onSuccess={(data) => setMuxData(data)}
                      sourceLanguage={sourceLanguage}
                      targetLanguages={captionTargets}
                    />
                  </>
                )}

                {/* Preview: thumbnail + what happens after "Crear".
                    Subtitles and the description both come from Mux's ASR
                    transcript, which only starts once the video has finished
                    encoding — minutes after this dialog closes. Nothing to
                    wait on here. */}
                {muxData && (
                  <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
                    {thumbnailUrl && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                        <Image
                          src={thumbnailUrl}
                          alt="Vista previa del video"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                      <p className="text-xs text-white/50">
                        Los subtitulos y la descripcion se generan solos despues
                        de crear la clase. Podes seguir el progreso desde la
                        vista previa.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" color="danger" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                onClick={() => {
                  setpdfUrl(undefined);
                }}
                type="submit"
                color="primary"
              >
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModuleModal;
