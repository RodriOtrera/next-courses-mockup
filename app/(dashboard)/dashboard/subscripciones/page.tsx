import { getUsersSubscriptions } from "@/lib/db/actions/subscription/subscriptions";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import React from "react";
import SubscriptionContainer from "@/app/(home)/subscripciones/SubscriptionsContainer";
import { get_coachings } from "@/lib/db/actions/get_coachings";

interface NextPageProps {}

const NextPage: React.FC<NextPageProps> = async ({}) => {
  const usarios = await getUsersSubscriptions();
  const coachings = await get_coachings();
  

  return (
    <div className={cn("min-h-screen pt-12 px-10 ")}>
      <h1 className="bg-gradient-to-r text-2xl md:text-4xl font-bold text-transparent bg-clip-text from-red-500 to-purple-500">
        SUBSCRIPCIONES DE USARIOS
      </h1>
      <SubscriptionContainer coachings={coachings} subscriptions={usarios} />
    </div>
  );
};

export default NextPage;
