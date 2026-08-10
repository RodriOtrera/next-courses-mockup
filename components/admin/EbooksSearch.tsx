import React, { useEffect } from "react";
import { UserDB } from "./CoursesUsersServer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import Image from "next/image";
import { EbookOutput } from "@/lib/db/actions/products_actions";

interface EbooksSearchProps {
  ebooks: EbookOutput[];
  handleEbookSelect: (ebook: EbookOutput) => void;
  ebookSelect?: EbookOutput | null;
}

const EbooksSearch: React.FC<EbooksSearchProps> = ({
  ebooks,
  handleEbookSelect,
  ebookSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [valueSelected, setvalueSelected] = React.useState<string | null>(null);
  const [value, setValue] = React.useState<string>("");
  
  useEffect(() => {
    if (ebookSelect) {
      setvalueSelected(ebookSelect.title);
      setValue(ebookSelect.title);
    }
  }, [ebookSelect]);

  return (
    <div>
      <p className="text-neutral-400 my-2">Ebooks</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex justify-between w-[400px]  text-ellipsis"
          >
            <p className=" text-start w-[400px] overflow-hidden text-ellipsis">
              {valueSelected ? valueSelected : "Buscar ebook "}
            </p>
            <SearchIcon className="opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[550px] p-0">
          <Command>
            <CommandInput
              value={value}
              onChangeCapture={(e) => {
                setValue(e.currentTarget.value);
              }}
              placeholder="Buscar ebooks"
            />

            <CommandList>
              <CommandEmpty>No encontrada.</CommandEmpty>
              <CommandGroup>
                {ebooks.map((ebook) => (
                  <CommandItem
                    onSelect={(currentValue) => {
                      setValue(ebook.title);
                      setOpen(false);
                      setvalueSelected(ebook.title);
                      handleEbookSelect(ebook);
                    }}
                    key={ebook.id}
                  >
                    <div className="flex">
                     
                      <div className="flex flex-col">
                        <p className="font-semibold">{ebook.title}</p>
                        <p className="text-xs text-gray-400">${ebook.price}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EbooksSearch;
