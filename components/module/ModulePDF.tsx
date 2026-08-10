"use client";

import { ModulePDFType } from "@/lib/db/schema/modules_items";
import { Button } from "../ui/button";

const ModulePDF = ({ modulePDF }: { modulePDF: ModulePDFType }) => {
  return (
    <div className="flex justify-center items-center flex-col h-[50vh]">
      <div className="max-w-[1080px]">
        <h1 className="font-bold text-3xl pb-4 ">Modulo: {modulePDF.title}</h1>
      </div>
      <Button
        onClick={() => {
          window.open(modulePDF.pdf_url!);
        }}
        className="bg-red-700 mb-20 w-40"
      >
        Descargar PDF
      </Button>
    </div>
  );
};

export default ModulePDF;
