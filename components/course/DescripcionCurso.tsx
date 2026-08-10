import React from "react";
import { FileTextIcon } from "lucide-react";

interface DescripcionCusoProps {
  content: string;
}

const DescripcionCuso: React.FC<DescripcionCusoProps> = ({ content }) => {
  return (
    <div className="fade-in-view py-16">
      <div className="flex items-center justify-center gap-2.5 mb-6">
        <FileTextIcon className="w-5 h-5 text-red-400" />
        <h2 className="text-xl font-bold text-white/90 tracking-tight lg:text-2xl">
          Descripcion del curso
        </h2>
      </div>
      <p className="mx-auto max-w-3xl px-8 text-center text-sm leading-relaxed text-white/45 md:px-16 lg:text-base">
        {content}
      </p>
    </div>
  );
};

export default DescripcionCuso;
