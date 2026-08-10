"use client";

import React, { useEffect, useState } from "react";
import EbooksSearch from "./EbooksSearch";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { addEbookAction } from "@/lib/db/actions/ebooks/add_ebook_action";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { UserDB } from "./CoursesUsersServer";
import UsersSearch from "./UsersSearch";
import { EbookOutput } from "@/lib/db/actions/products_actions";

export const UsersAndEbooksAdmin = ({
  ebooks,
  users,
}: {
  users: UserDB[];
  ebooks: EbookOutput[];
}) => {
  const [userSelected, setuserSelected] = useState<UserDB | null>(null);
  const [ebookSelected, setEbookSelected] = useState<EbookOutput | null>(null);
  const { executeAsync, isExecuting, hasSucceeded } =
    useAction(addEbookAction);

  const searchParams = useSearchParams();

  const ebook_id = searchParams.get("ebook_id");
  const user_id = searchParams.get("user_id");

  useEffect(() => {
    if (ebook_id && user_id) {
      const ebook = ebooks.find((e) => e.id == ebook_id);
      const user = users.find((e) => e.id == user_id);
      if (ebook && user) {
        setEbookSelected(ebook);
        setuserSelected(user);
      }
    }
  }, [ebook_id, user_id, ebooks, users]);

  return (
    <div className="flex flex-col">
      <UsersSearch
        userSelect={userSelected}
        handleUserSelect={(user) => {
          setuserSelected(user);
        }}
        users={users}
      />
      <EbooksSearch
        ebookSelect={ebookSelected}
        handleEbookSelect={(ebook) => {
          setEbookSelected(ebook);
        }}
        ebooks={ebooks}
      />{" "}
      {isExecuting ? (
        <Loader2 className="mt-4 text-green-400 self-end animate-spin" />
      ) : (
        <Button
          disabled={!userSelected || !ebookSelected}
          className="mt-4 self-end"
          variant="outline"
          onClick={async () => {
            await executeAsync({
              ebook_id: ebookSelected!.id,
              user_id: userSelected!.id,
            });

            toast.success(
              `Ebook ${ebookSelected?.title} agregado a ${userSelected?.email}`
            );
          }}
        >
          Confirmar agregar ebook
        </Button>
      )}
    </div>
  );
};
