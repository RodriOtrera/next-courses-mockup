import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "../ui/button";
import { CourseProgressItem } from "./CourseProgressItem";
import { CourseProgressSelection } from "@/lib/db/actions/courses_progress_actions";
import { GraduationCap } from "lucide-react";

export default function DrawerCourses({
  progress,
}: {
  progress: CourseProgressSelection[] | undefined;
}) {
  return (
    <div>
      <Drawer>
        <DrawerTrigger className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white/[0.08] sm:px-4">
          <GraduationCap className="h-4 w-4 text-[#EC4E39]" />
          <span className="hidden sm:inline">MIS CURSOS</span>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mis cursos</DrawerTitle>
            <DrawerDescription>
              Aqui encontraras todos los cursos que hayas comprado
            </DrawerDescription>
          </DrawerHeader>
          <div className="custom-scrollbar max-h-[50vh] overflow-y-auto">
            {progress == undefined || progress.length == 0 ? (
              <div className="flex h-20 items-center justify-center text-neutral-500">
                No tienes ningun curso comprado
              </div>
            ) : (
              progress.map((e) => (
                // asChild keeps the item's own buttons out of a nested button.
                <DrawerClose key={e.id} asChild>
                  <div>
                    <CourseProgressItem courseProgress={e} />
                  </div>
                </DrawerClose>
              ))
            )}
          </div>

          <DrawerFooter>
            <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
