"use client";

import { useUploadFile } from "@better-upload/client";
import { UploadButton } from "./UploadButton";
import { useState } from "react";

const ImageUploader = ({
  onUploadComplete,
  showLabel = true,
}: {
  onUploadComplete: (url: string) => void;
  showLabel?: boolean;
}) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const { control } = useUploadFile({
    route: "imageUploader",
    api: "/api/upload",
  });

  return (
    <div>
      {imgUrl != undefined ? (
        <h1>{showLabel && "Imagen Subida!"}</h1>
      ) : (
        <UploadButton
          control={control}
          label="SUBIR IMAGEN"
          onUploadComplete={(url) => {
            setImgUrl(url);
            onUploadComplete(url);
          }}
        />
      )}
      <input hidden name="img_url" value={imgUrl ?? ""} />
    </div>
  );
};

export default ImageUploader;
