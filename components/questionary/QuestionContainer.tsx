"use client";
import { cn } from "@/lib/utils";

import { Check, DeleteIcon, PlusIcon, Trash } from "lucide-react";
import React, { useState } from "react";
import OptionContainer from "./OptionsContainer";
import OptionContainerExam from "./OptionExamAnswer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Option,
  QuestionGet,
} from "@/lib/db/actions/courses/questionary_actionst";

const QuestionContainer = ({
  question,
  currentQuestionSelected,
  onClick,
  onCreateResponse,
  type = "questionary",
  isAdmin = false,
  onDeleteOption,
}: {
  question: QuestionGet;
  currentQuestionSelected: string;
  onClick: (questionId: string) => void;
  onCreateResponse: (questionId: string, option: Option) => void;
  onDeleteOption: (questionId: string, option: Option) => void;

  type?: "exam" | "questionary";
  isAdmin?: boolean;
}) => {
  const [optionTitle, setoptionTitle] = useState("");
  const [newResponseIsCorrect, setNewResponseIsCorrect] = useState(false);
  return (
    <div className="">
      <h1 className="font-bold text-2xl text-center">{question.title}</h1>
      {/* <Divider className="my-3" /> */}
      {type == "questionary" &&
        question.options.map((e, index) => (
          <OptionContainer
            onDeleteOption={onDeleteOption}
            isAdmin={isAdmin}
            key={e.id}
            option={e}
            currentQuestionSelected={currentQuestionSelected}
            onClick={onClick}
          />
        ))}
      {type == "exam" &&
        question.options.map((e, index) => (
          <OptionContainerExam
            isAdmin={isAdmin}
            onDeleteOption={onDeleteOption}
            key={e.id}
            option={e}
            currentQuestionSelected={currentQuestionSelected}
            onClick={onClick}
          />
        ))}
      {isAdmin && (
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusIcon /> Respuesta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>Agregar pregunta</DialogHeader>
              <Input
                value={optionTitle}
                onChange={(e) => {
                  setoptionTitle(e.target.value);
                }}
                placeholder="Respuesta"
              />
              <div className="flex items-start gap-3 pl-2">
                <Checkbox
                  id="esCorrecta"
                  checked={newResponseIsCorrect}
                  onClick={() => {
                    setNewResponseIsCorrect(!newResponseIsCorrect);
                  }}
                  color="success"
                />
                <Label htmlFor="esCorrecta">Es correcta</Label>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      const newResponse: Option = {
                        id: crypto.randomUUID(),
                        isCorrect: newResponseIsCorrect,
                        question_id: question.id,
                        title: optionTitle,
                      };
                      onCreateResponse(question.id, newResponse);
                      setNewResponseIsCorrect(false);
                    }}
                  >
                    Agregar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default QuestionContainer;
