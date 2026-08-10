"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAction } from "next-safe-action/hooks";
import { emailAction } from "@/lib/db/actions/email/email_action";
import { toast } from "sonner";
import ImageUploader from "@/components/uploaders/ImageUploader";

interface EmailComponentProps {}

// Mirrors the `email_type` enum accepted by emailAction.
type EmailType =
  | "allUsers"
  | "usersWithCourses"
  | "usersWithEbookProgram"
  | "usersWithCoaching"
  | "test";

const EmailComponent: React.FC<EmailComponentProps> = ({}) => {
  const { executeAsync, isExecuting } = useAction(emailAction);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [emailType, setEmailType] = useState<EmailType>("allUsers");
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);

  return (
    <div className="mt-4 max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">
      {/* Form Section */}
      <div className="flex-1">
        <RadioGroup
          orientation="horizontal"
          defaultValue="option-one"
          className="flex space-x-2 text-neutral-400"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-one"
              id="option-one"
              onClick={() => setEmailType("allUsers")}
            />
            <Label htmlFor="option-one">Todos los usuarios</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-two"
              id="option-two"
              onClick={() => setEmailType("usersWithCourses")}
            />
            <Label htmlFor="option-two">Usuarios con cursos</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-three"
              id="option-three"
              onClick={() => setEmailType("usersWithEbookProgram")}
            />
            <Label htmlFor="option-three">Usuarios con ebook/programa</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-four"
              id="option-four"
              onClick={() => setEmailType("usersWithCoaching")}
            />
            <Label htmlFor="option-four">Usuarios del coaching</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-five"
              id="option-five"
              onClick={() => setEmailType("test")}
            />
            <Label htmlFor="option-five">Test</Label>
          </div>
        </RadioGroup>

        <div className="mt-8 space-y-4">
          <div>
            <Label htmlFor="title">Título del email</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del email"
            />
          </div>

          <div>
            <Label htmlFor="content">Contenido del email</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenido del email"
              className="min-h-[140px]"
            />
          </div>

          <ImageUploader
            showLabel={true}
            onUploadComplete={(url) => setImgUrl(url)}
          />

          <Button
            disabled={isExecuting}
            onClick={async () => {
              try {
                await executeAsync({
                  title: title,
                  content: content,
                  buttonTitle: "Enviar",
                  email_type: emailType,
                  img_url: imgUrl,
                });
                toast.success("Email enviado");
              } catch (error) {
                toast.error("Error enviando el email");
              }
            }}
            className="w-full"
            variant="outline"
          >
            Enviar Email
          </Button>
        </div>
      </div>

      {/* Email Preview Section */}
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-4">Vista previa del email</h2>
        <div className="border rounded-lg p-4 bg-black max-w-[600px] mx-auto">
          <table
            role="presentation"
            cellSpacing={0}
            cellPadding={0}
            border={0}
            style={{ width: "100%" }}
          >
            <tbody>
              <tr>
                <td align="center" style={{ padding: "20px 0" }}>
                  {/* Main email container */}
                  <table
                    role="presentation"
                    cellSpacing={0}
                    cellPadding={0}
                    border={0}
                    style={{
                      width: "100%",
                      maxWidth: "600px",
                      margin: "0 auto",
                      backgroundColor: "black",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{ padding: "40px 20px", textAlign: "center" }}
                        >
                          <img
                            src="https://xvgfdttoun.ufs.sh/f/bcAmghSQ9AflFrNEKgHm7XQfSVgE6x3LBiMtTUKD5CjuWlZn"
                            width="100"
                            height="100"
                            alt="AXELDUBIN logo"
                            style={{
                              borderRadius: "16px",
                              objectFit: "cover",
                              margin: "0 auto",
                            }}
                          />

                          <p
                            style={{
                              color: "#707070",
                              fontSize: "16px",
                              lineHeight: "1.5",
                              marginBottom: "20px",
                            }}
                          >
                            AXELDUBIN - WEB
                          </p>

                          <h1
                            style={{
                              color: "white",
                              fontSize: "24px",
                              marginBottom: "20px",
                            }}
                          >
                            {title || "Título del email"}
                          </h1>

                          <p
                            style={{
                              color: "#808080",
                              fontSize: "16px",
                              lineHeight: "1.5",
                              marginBottom: "20px",
                              textAlign: "start",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {content || "Contenido del email aparecerá aquí..."}
                          </p>

                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt="Imagen"
                              width="300"
                              height="140"
                              style={{
                                borderRadius: "16px",
                                objectFit: "cover",
                                marginBottom: "20px",
                              }}
                            />
                          )}

                          {/* Button using table method for maximum compatibility */}
                          <table
                            role="presentation"
                            cellSpacing={0}
                            cellPadding={0}
                            border={0}
                            style={{ width: "100%", color: "white" }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "10px 0",
                                    color: "white",
                                  }}
                                >
                                  <a
                                    href="https://axeldubin.com/productos"
                                    style={{
                                      display: "inline-block",
                                      padding: "15px 30px",
                                      backgroundColor: "#ec4e39",
                                      color: "white",
                                      textDecoration: "none",
                                      borderRadius: "5px",
                                      fontSize: "16px",
                                      fontWeight: "bold",
                                      textAlign: "center",
                                      margin: "20px 0",
                                      transition:
                                        "background-color 0.3s ease",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "white",
                                        padding: 0,
                                        margin: 0,
                                      }}
                                    >
                                      Segui con todo!
                                    </span>
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <p
                            style={{
                              color: "#808080",
                              fontSize: "16px",
                              lineHeight: "1.5",
                              marginBottom: "20px",
                            }}
                          >
                            Si tenes alguna pregunta, no dudes en ponerte en
                            contacto
                          </p>

                          <p
                            style={{
                              fontStyle: "italic",
                              color: "#808080",
                              fontSize: "16px",
                              lineHeight: "1.5",
                              marginBottom: "20px",
                            }}
                          >
                            Las excusas y los limites son ilusiones del ego,
                            <br />
                            Axel Dubin
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailComponent;
