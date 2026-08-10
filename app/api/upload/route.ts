import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { aws } from "@better-upload/server/clients";

const router: Router = {
  client: aws(),
  bucketName: process.env.S3_BUCKET_NAME!,
  routes: {
    imageUploader: route({
      fileTypes: ["image/*"],
      maxFileSize: 1024 * 1024 * 4, // 4MB
      onBeforeUpload: async ({ file }) => {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

        return {
          objectInfo: {
            key: `products/${timestamp}-${sanitizedName}`,
          },
        };
      },
      onAfterSignedUrl: async ({ file }) => {
        const bucket = process.env.S3_BUCKET_NAME;
        const region = process.env.AWS_REGION || "us-east-2";
        return {
          metadata: {
            publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${file.objectInfo.key}`,
          },
        };
      },
    }),
    pdfUploader: route({
      fileTypes: ["application/pdf"],
      maxFileSize: 1024 * 1024 * 10, // 10MB
      onBeforeUpload: async ({ file }) => {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

        return {
          objectInfo: {
            key: `pdfs/${timestamp}-${sanitizedName}`,
          },
        };
      },
      onAfterSignedUrl: async ({ file }) => {
        const bucket = process.env.S3_BUCKET_NAME;
        const region = process.env.AWS_REGION || "us-east-2";
        return {
          metadata: {
            publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${file.objectInfo.key}`,
          },
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
