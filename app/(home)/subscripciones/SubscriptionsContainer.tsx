"use client";

import { SubscriptionsSelect } from "@/lib/db/actions/subscription/subscriptions";
import React, { useState } from "react";
import UsuariosSubscriptionsContainer from "./UsuariosSubscriptionsContainer";
import { Input } from "@/components/ui/input";
import { CoachingTypeSelect } from "@/lib/db/actions/get_coachings";
import { Checkbox } from "@/components/ui/checkbox";

interface SubscriptionContainerProps {
  subscriptions: SubscriptionsSelect;
  coachings: CoachingTypeSelect[];
}

const SubscriptionContainer: React.FC<SubscriptionContainerProps> = ({
  subscriptions,
  coachings,
}) => {
  const [filter, setfilter] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  return (
    <div className="mt-4">
      <Input
        placeholder="Buscar por email"
        value={filter}
        onChange={(e) => {
          setfilter(e.target.value);
        }}
      />
      <div className="flex items-center mt-2 pl-1">
        <Checkbox
          checked={onlyActive}
          onCheckedChange={() => setOnlyActive(!onlyActive)}
        />
        <label className="ml-2 text-sm">Solo activos</label>
      </div>
      {subscriptions
        .filter((e) => e.email?.includes(filter))
        .filter((e) => !onlyActive || e.subscriptions[0]?.active)
        .map((e) => (
          <UsuariosSubscriptionsContainer
            key={e.id}
            usuario={e}
            coachings_availables={coachings.map((c) => ({
              id: c.id,
              name: c.name,
            }))}
          />
        ))}
    </div>
  );
};

export default SubscriptionContainer;
