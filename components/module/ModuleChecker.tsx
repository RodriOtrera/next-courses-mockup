import { ModuleZod } from "@/lib/db/schema/modules_items";
import ModulePDF from "./ModulePDF";
import ModuleQuestionary from "./ModuleQuestionary";
import ModuleVideo from "./ModuleVideo";

const ModuleChecker = ({ moduleDB }: { moduleDB: ModuleZod }) => {
  return (
    <div className="min-h-1/2">
      {" "}
      {moduleDB.type == "pdf" ? <ModulePDF modulePDF={moduleDB} /> : null}
      {moduleDB.type == "video" ? <ModuleVideo moduleVideo={moduleDB} /> : null}
      {moduleDB.type == "questionario" ? (
        <ModuleQuestionary questionary_id={moduleDB.questionary_id!} />
      ) : null}
    </div>
  );
};

export default ModuleChecker;
