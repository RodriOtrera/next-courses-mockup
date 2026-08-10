import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  home_testimonials,
  HomeTestimonial,
} from "@/lib/db/schema/home_testimonials";
import { eq } from "drizzle-orm";
import { DeleteIcon, Trash2Icon } from "lucide-react";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import React from "react";

const HomeTestimonialContainer: React.FC<
  HomeTestimonial & { admin?: boolean }
> = ({ content, user_name, id, user_img_url, admin = false }) => {
  //hello
  return (
    <div
      className="relative w-full min-h-[200px]"
    >
      <div
        className="px-4 pt-6 pb-10 rounded-lg relative bg-neutral-800 shadow-2xl h-full"
      >
        <div className="flex items-center">
          <Image
            width={54}
            height={54}
            src={user_img_url}
            className="h-10  w-10  rounded-full  overflow-clip cursor-pointer mr-2 border-spacing-4 object-fit"
            alt="HELLO"
          />

          <p className=" text-md font-bold text-white"> {user_name}</p>
        </div>
        <p className=" text-neutral-300 text-sm mt-2">{content}</p>
      </div>
      {admin && (
        <div className="absolute bottom-2 right-2 ">
          <form
            action={async () => {
              "use server";
              await db
                .delete(home_testimonials)
                .where(eq(home_testimonials.id, id));
              revalidatePath("/testimonios");
            }}
          >
            <Button variant={"outline"} type="submit">
              <Trash2Icon className="text-red-500" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default HomeTestimonialContainer;
