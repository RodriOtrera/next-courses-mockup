"use client";
import React from "react";
import { ProgressBar } from "./HorizontalProgressBar2";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseModules } from "@/lib/db/actions/courses/course_and_module";

const ModuleCourseNavigation = ({
  course_id,
  module_item_id,
}: {
  course_id: string;
  module_item_id: string;
}) => {
  const { data: course } = useQuery({
    // Must include course_id — a bare ["modules"] key makes two different
    // courses share one cache entry.
    queryKey: ["modules", course_id],
    queryFn: async () => {
      return axios
        .post("/api/coursemodules", {
          course_id: course_id,
        })
        .then((response) => {
          // console.log(response.data);
          return response.data as CourseModules;
        });
    },
    staleTime: 50000, // Data will never become stale automatically
    gcTime: 6000000, // Cache will never expire automatically
  });

  if (course == undefined) {
    return (
      <div className=" mt-10 w-full max-w-[900px] mx-auto flex flex-col">
        <Skeleton className="h-6 max-w-full w-[500px]  mb-3" />
        <Skeleton className="h-4 w-full " />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20 " />

          <Skeleton className="h-4 w-16 " />
        </div>
      </div>
    );
  }

  const allModulesItems = course.modules.flatMap((e) => e.items);
  const indexOfModule = allModulesItems.findIndex(
    (e) => e.id == module_item_id
  );

  return (
    <div className=" mt-10 w-full max-w-[900px] mx-auto flex flex-col">
      {" "}
      <h2 className="text-2xl font-black mb-2">{course.title}</h2>
      <div className=" ">
        <ProgressBar
          percentage={((indexOfModule + 1) / allModulesItems.length) * 100}
          backgroundColor="#181818"
          fillColor="#ec4e39"
          height={12}
          duration={1.5}
          showLabel={true}
          className="rounded-xl"
        />
      </div>
      <div className="bg-neutral-900 rounded-xl mt-8 px-4 py-2">
        <Accordion type="single" collapsible>
          {" "}
          {course.modules.map((e, indexOfModule) => (
            <AccordionItem key={e.id} value={e.id}>
              <AccordionTrigger className="text-start text-sm font-bold">
                <div className="flex flex-col">
                  <p>{e.title}</p>
                  <p className="text-neutral-400 text-xs font-semibold">
                    {" "}
                    Capitulos {e.items.length}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {e.items.map((e, itemIndex) => (
                  <Link
                    href={`/module/${e.id}?course=${course_id}`}
                    className="mb-1 hover:bg-neutral-800  ease-in-out duration-500 transition-colors rounded-lg px-2 py-1 block"
                    key={e.id}
                  >
                    <div className="flex items-center">
                      <div className="bg-[#ec4e39] w-1 h-[12px]  rounded-md"></div>

                      <span className="text-neutral-400 font-semibold mx-2">
                        {indexOfModule + 1}.{itemIndex + 1}{" "}
                      </span>
                      {/* <div className="bg-[#ec4e39] w-1 h-[12px] mx-2 rounded-md"></div> */}
                      {e.title}
                    </div>
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default ModuleCourseNavigation;
