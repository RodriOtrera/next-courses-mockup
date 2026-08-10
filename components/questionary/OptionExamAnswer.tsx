import { cn } from "@/lib/utils";
import { Check, Trash, Verified, XCircle } from "lucide-react";
import React from "react";
import { Checkbox } from "../ui/checkbox";
import { Option } from "@/lib/db/actions/courses/questionary_actionst";

interface OptionContainerExamProps {
  option: Option;
  onClick: (questionId: string) => void;
  currentQuestionSelected: string;
  onDeleteOption: (questionId: string, option: Option) => void;
  isAdmin: boolean;

}

const OptionContainerExam: React.FC<OptionContainerExamProps> = ({
  onClick,
  option,
  currentQuestionSelected,
  onDeleteOption,
  isAdmin = false,
}) => {
  const selected: boolean = currentQuestionSelected == option.id;
  return (
    <div className="flex my-4 items-center" key={option.id}>
      <div
        className={cn(
          "flex-1 justify-between bg-neutral-800 flex font-semibold px-6 py-3 cursor-pointer rounded-full transition-all hover:scale-[1.02] shadow-lg"
        )}
      >
        <h2>{option.title}</h2>
      </div>
      <Checkbox
        checked={selected}
        onClick={() => {
          onClick(option.id);
        }}
        className="ml-2"
        color="success"
      />
      {option.isCorrect && isAdmin ? <Verified /> : null}
    </div>
  );
};

export default OptionContainerExam;
