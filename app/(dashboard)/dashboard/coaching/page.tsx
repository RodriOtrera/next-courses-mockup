import Coachings from "@/components/coaching/coachings";
import { cn } from "@/lib/utils";


const CoachingAdmin = async () => {
  // const admin = await checkAdmin();
  // if (admin == null) {
  //   console.log(admin);
  //   redirect("/");
  // }
  // const semanas = await getSemanas();
  // const currentMeeting = (await db.select().from(meeting_schema))[0]!;
  // const currentCard = (await db.select().from(card_schema))[0]!;
  return (
    <div className={cn(" pt-20 min-h-screen flex flex-col items-start justify-center")}>
      <Coachings admin={true} />
   
    </div>
  );
};

export default CoachingAdmin;
