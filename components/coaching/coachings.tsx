
import CoachingVip from "@/app/(home)/_components/CoachingVip";
import { get_coachings } from "@/lib/db/actions/get_coachings";

export default async function Coachings({
  admin = false,
}: {
  admin?: boolean;
}) {
  const coachingsData = await get_coachings();
  const vipCoaching = coachingsData.find((c) => c.name.toLowerCase().includes("vip")) ?? coachingsData[0]!;
  return (
    <div className="flex w-full justify-center">
      <CoachingVip admin={admin} coaching={vipCoaching} />
    </div>
  );
}
