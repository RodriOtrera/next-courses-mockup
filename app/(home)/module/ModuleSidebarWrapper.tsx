"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import ModuleProgressSidebar from "./ModuleProgressSidebar";

export default function ModuleSidebarWrapper({
  course_id,
  module_item_id,
}: {
  course_id: string;
  module_item_id: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-[340px] shrink-0 lg:block sticky top-16 h-[calc(100vh-4rem)]">
        <ModuleProgressSidebar course_id={course_id} module_item_id={module_item_id} />
      </div>

      {/* Mobile sheet trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full bg-[#ec4e39] text-white shadow-lg hover:bg-[#d4432f]"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[340px] border-neutral-800 bg-neutral-950 !p-0 flex flex-col h-full">
          <SheetTitle className="sr-only">Navegacion del curso</SheetTitle>
          <div className="h-full overflow-hidden">
            <ModuleProgressSidebar course_id={course_id} module_item_id={module_item_id} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
