"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseOnly } from "@/lib/db/schema/course";

interface CoursesSearchProps {
  courses: CourseOnly[];
  handleCourseSelect: (user: CourseOnly) => void;
  courseSelect?: CourseOnly | null;
}

const CoursesSearch: React.FC<CoursesSearchProps> = ({
  courses,
  handleCourseSelect,
  courseSelect,
}) => {
  const [open, setOpen] = React.useState(false);
  const [valueSelected, setvalueSelected] = React.useState<string | null>(null);
  const [value, setValue] = React.useState<string>("");
  useEffect(() => {
    if (courseSelect) {
      setvalueSelected(courseSelect.title);
      setValue(courseSelect.title);
    }
  }, [courseSelect]);

  return (
    <div>
      {" "}
      <p className="text-neutral-400 my-2">Cursos</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex justify-between w-full md:w-[400px]  text-ellipsis"
          >
            <p className=" text-start w-full overflow-hidden text-ellipsis">
              {valueSelected ? valueSelected : "Buscar curso "}
            </p>
            <SearchIcon className="opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] md:w-[550px] p-0">
          <Command>
            <CommandInput
              value={value}
              onChangeCapture={(e) => {
                setValue(e.currentTarget.value);
              }}
              placeholder="Buscar cursos"
            />

            <CommandList>
              <CommandEmpty>No encontrada.</CommandEmpty>
              <CommandGroup>
                {courses.map((course) => (
                  <CommandItem
                    onSelect={(currentValue) => {
                      setValue(course?.title || '');
                      setOpen(false);
                      setvalueSelected(course?.title || '');
                      handleCourseSelect(course);
                    }}
                    key={course.id}
                  >
                    <div className="flex">
                      <div className="relative   mr-2 bg-neutral-800 w-[180px] h-[60px]  rounded-xl overflow-hidden ">
                        {course?.img_url && (
                          <Image
                            width={180}
                            height={60}
                            src={course.img_url}
                            alt={course?.title || 'Course image'}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-semibold">{course?.title || 'Untitled Course'}</p>
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

export default CoursesSearch;
