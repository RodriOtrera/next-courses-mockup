"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPlanId } from "@/lib/db/actions/coaching/set_plan_id";
import {
  cancelSubscription,
  createSubscriptionOrActivate,
} from "@/lib/db/actions/subscription/create_subscription";
import { UserWithSubscription } from "@/lib/db/actions/subscription/subscriptions";

import { LoaderIcon, UserCheck, UserX } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import React from "react";

const UsuariosSubscriptionsContainer = ({
  usuario,
  coachings_availables,
}: {
  usuario: UserWithSubscription;
  coachings_availables: {
    id: string;
    name: string;
  }[];
}) => {
  // `users.subscriptions` is a `many` relation, but the app only ever creates
  // one row per user (see createSubscriptionOrActivate), so take the first.
  const subscription = usuario.subscriptions[0];
  const subscriptionIsActive = subscription != null && !!subscription.active;
  const { executeAsync, isExecuting } = useAction(setPlanId);

  const currentSubscription: string | undefined = subscription
    ? coachings_availables.find((e) => e.id === subscription.coaching_id)?.name
    : undefined;

  return (
    <div className="flex md:flex-row flex-col justify-between rounded-xl hover:border-red-800 transition-all border my-4 px-8 py-2 items-center  ">
      <div className="flex md:flex-row flex-col items-center md:items-start">
        <div className="h-16  w-16 relative rounded-full  overflow-clip cursor-pointer p-3 my-4 border-spacing-4">
          {usuario.image ? (
            // Avatars come from whichever OAuth provider the user signed up
            // with, so the host is not in next.config remotePatterns —
            // `unoptimized` skips the optimizer and its host allowlist.
            <Image
              fill={true}
              unoptimized
              src={usuario.image}
              className="object-cover"
              alt={usuario.name}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-300 text-lg font-semibold">
              {usuario.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="flex flex-col md:items-start items-center md:ml-4">
          <h5 className="text-neutral-300 text-md font-semibold ">
            {usuario.name}
          </h5>
          <h5 className="text-neutral-400 text-sm ">{usuario.email}</h5>
          {subscriptionIsActive ? (
            <div className="px-4 py-2 rounded-lg bg-green-950 mt-2">
              <h1 className="text-sm text-green-500 font-semibold">
                Subscripcion Activa
              </h1>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-lg bg-red-950 mt-2">
              <h1 className="text-sm text-red-500 font-semibold">
                Subscripcion Inactiva
              </h1>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {subscriptionIsActive ? (
          <form
            action={cancelSubscription}
            className=" h-full md:ml-auto flex flex-col "
          >
            <input
              defaultValue={subscription!.id}
              hidden
              name="subId"
            />

            <Button
              size="sm"
              variant="ghost"
              className="mt-2 bg-neutral-950 border-red-800 hover:border-neutral-950 md:ml-auto transition-all border text-red-500"
            >
              <UserX className="mr-2 h-4 w-4 " />

              <h1 className="text-red-500">Cancelar Subscripcion</h1>
            </Button>
          </form>
        ) : (
          <form
            action={createSubscriptionOrActivate}
            className=" h-full md:ml-auto"
          >
            <input defaultValue={usuario.id} hidden name="user_id" />
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 bg-neutral-950 border-green-800 hover:border-neutral-950  transition-all border text-green-500"
            >
              <UserCheck className="mr-2 h-4 w-4 " />

              <h1 className="text-green-500">Activar subscripción</h1>
            </Button>
          </form>
        )}
        {isExecuting ? (
          <LoaderIcon className="w-6 h-6 " />
        ) : (
          !!subscription &&
          subscription.active && (
            <Select
              onValueChange={(value) => {
                executeAsync({
                  plan_id: value,
                  subscription_id: subscription.id,
                });
              }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue
                  defaultValue={currentSubscription}
                  placeholder={currentSubscription}
                />
              </SelectTrigger>
              <SelectContent>
                {coachings_availables.map((e) => (
                  <SelectItem value={e.id} key={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}
      </div>
    </div>
  );
};

export default UsuariosSubscriptionsContainer;
