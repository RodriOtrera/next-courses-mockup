import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FrequentlyAskedQuestion } from "@/lib/db/schema/frequently_asked_questions";

const PreguntaFrecuenteContainer = ({
  item,
  index,
}: {
  item: FrequentlyAskedQuestion;
  index: number;
}) => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value={item.id}
        className="group rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 hover:bg-white/[0.06] transition-colors data-[state=open]:border-red-500/30 data-[state=open]:bg-white/[0.05]"
      >
        <AccordionTrigger className="py-4 hover:no-underline gap-3">
          <span className="flex items-center gap-3 text-left">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-600/20 text-red-500 text-xs font-extrabold shrink-0 group-data-[state=open]:bg-red-600/30 transition-colors">
              {String(index).padStart(2, "0")}
            </span>
            <span className="font-bold text-white/90 text-sm leading-snug group-data-[state=open]:text-white transition-colors">
              {item.question}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pl-10 text-neutral-400 text-[13px] leading-relaxed">
          {item.response}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PreguntaFrecuenteContainer;
