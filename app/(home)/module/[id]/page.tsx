
import ModuleChecker from "@/components/module/ModuleChecker";
import { getModule } from "@/lib/db/actions/courses/get_module";
import { moduleZodIntersecttion } from "@/lib/db/schema/modules_items";
import ModuleSidebarWrapper from "../ModuleSidebarWrapper";
import LessonXpAward from "@/components/gamification/LessonXpAward";

import WhatsappIcon from "../../_components/WhatsappIcon";

import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Lección");

const ModuleItemPage = async (props: PageParams<
  { id: string },
  { course: string; fromHome?: string; course_progress: string }
>) => {
  const { id } = await props.params;
  const { course, fromHome, course_progress } = await props.searchParams;
  const moduleDb = await getModule(id, course, course_progress);
  const moduleParsed = moduleZodIntersecttion.parse(moduleDb);

  return (
    <div className="flex min-h-screen pt-16">
      {/* Awards XP for this lesson once the learner has actually stayed on it. */}
      <LessonXpAward course_id={course} module_item_id={id} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-[1000px] mx-auto">
          <ModuleChecker moduleDB={moduleParsed} />
        </div>
        {id == "6fcb5c19-cbc3-4628-ba13-b5219f502535" && (
          <div className="flex justify-center px-8">
            <a
              href="https://chat.whatsapp.com/EkhdvnZ27qtDWVN2ZGtiID"
              className="bg-green-600 max-w-[600px] px-6 py-4 items-center flex mt-12 cursor-pointer hover:bg-green-500 transition rounded-lg"
            >
              <WhatsappIcon classname="w-8 h-8 text-white" />
              <p className="font-bold text-center pl-2">
                Click aqui para acceder al grupo de Whatsapp exclusivo de
                entrenadores
              </p>
            </a>
          </div>
        )}
      </div>

      {/* Right sidebar - desktop inline, mobile sheet */}
      <ModuleSidebarWrapper course_id={course} module_item_id={id} />
    </div>
  );
};
export default ModuleItemPage;
