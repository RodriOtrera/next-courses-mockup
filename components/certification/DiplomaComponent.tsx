"use client";
import { Certificate } from "@/app/(home)/certificados/[id]/page";
import Image from "next/image";
import React, { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { toJpeg, toPng } from "html-to-image";

import DiplomaParticipant from "./DiplomaParticipant";
import CertificadoSvg from "@/app/(home)/certificados/CertificadoSvg";
import SVGComponent from "@/app/(home)/certificados/CertificadoSvg";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import LeaveTestimonyDialog from "../course/LeaveTestimonyDialog";
import { Loader2 } from "lucide-react";
import { pageStyles } from "@/app/(home)/_components/pagestyles";

interface DiplomaComponentProps {
  certificate: NonNullable<Certificate>;
  canCreate: boolean;
}

const DiplomaComponent: React.FC<DiplomaComponentProps> = ({
  certificate,
  canCreate,
}) => {
  const elementRef = useRef(null);
  const [testimonySent, setTestimonySent] = useState(false);
  const [username, setUsername] = useState(certificate.user?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const htmlToImageConvert = () => {
    setIsLoading(true);
    toJpeg(elementRef.current!, { cacheBust: true, quality: 1 })
      .then((dataUrl) => {
        setIsLoading(false);
        const link = document.createElement("a");
        link.download = `Certificado ${certificate.course.title}`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <div
      className={cn(
        " min-h-screen py-32 flex flex-col justify-center items-center",
        pageStyles.padding
      )}
    >
      <div className="flex">
        <Input
          color="success"
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          placeholder="Tu nombre"
          className="max-w-[300px] mr-4 "
          value={username ?? ""}
        />
      </div>

      <div
        ref={elementRef}
        className="h-[300px] bg-transparent flex justify-center items-center  w-[420px] md:h-[600px] md:w-[840px] relative  "
      >
        <div className="absolute top-[45%] flex justify-center items-center flex-col">
          <h1 className="text-sm md:text-2xl  font-semibold border-b-2 border-orange-400 w-[300px] md:w-[600px] text-center">
            {username}
          </h1>
          <h1 className="text-[0.6rem] md:text-xl mt-2 top-[55%] max-w-[350px] md:max-w-[700px] text-center  font-bold">
            HA COMPLETADO SATISFACTORIAMENTE EL{" "}
            {certificate.course.title.toUpperCase()}
          </h1>
        </div>

        <SVGComponent />
      </div>
      <div className="flex mt-12 space-x-2 items-center">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Button
            onClick={() => {
              htmlToImageConvert();
            }}
            className=""
            variant="outline"
            color="success"
          >
            Descargar
          </Button>
        )}

        {canCreate && !testimonySent ? (
          <LeaveTestimonyDialog
            onSent={() => {
              setTestimonySent(true);
            }}
            course_id={certificate.course_id}
          />
        ) : (
          <h1 className="text-neutral-400 text-sm">Testimonio realizado!</h1>
        )}
      </div>
    </div>
  );
};

export default DiplomaComponent;
