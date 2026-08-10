import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { coachingItems } from "@/lib/db/schema/coaching_items";
import { eq } from "drizzle-orm";
import { Check, Trash2Icon } from "lucide-react";
import { revalidatePath } from "next/cache";

export async function UpdateCoachingItems() {
  const items = await db.select().from(coachingItems);

  return (
    <div>
      <h1 className="font-bold text-2xl mb-4">Items del Coaching</h1>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Crear Item</Button>
        </DialogTrigger>

        <DialogContent>
          <form
            action={async (formData: FormData) => {
              "use server";
              const content = formData.get("content") as string;

              await db.insert(coachingItems).values({
                content: content,
                id: crypto.randomUUID(),
              });
              revalidatePath("/coachingAdmin");
            }}
          >
            <DialogHeader className="mb-4">Item</DialogHeader>
            <Input name="content" placeholder="Contenido" />

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="submit" variant="default">
                  Agregar
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {items.map((item) => (
        <div key={item.id} className="flex items-center">
          <div
            className="flex  flex-1 items-center bg-neutral-900 px-4 py-4 rounded-lg mt-3 text-md mr-4"
            key={item.id}
          >
            <div className=" w-6 h-6 flex items-center justify-center bg-red-500 rounded-md mr-4 ">
              <Check className=" h-4 w-4 text-black" />
            </div>
            <h2 className="font-bold text-xl mb-2">{item.content}</h2>
          </div>
          <form
            action={async () => {
              "use server";
              await db
                .delete(coachingItems)
                .where(eq(coachingItems.id, item.id));
              revalidatePath("/coachingAdmin");
            }}
          >
            <input
              hidden={true}
              name="id"
              defaultValue={item.id}
              value={item.id}
            />
            <Button variant={"outline"}>
              <Trash2Icon />
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}
