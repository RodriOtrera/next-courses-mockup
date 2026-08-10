import { CoachingView } from "@/lib/db/actions/subscription/subscriptions";
import { Atom, Crown, User2, UserCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import WhatsappIcon from "@/app/(home)/_components/WhatsappIcon";

interface CoachingViewProps {
  coaching: CoachingView;
}

const CoachingViewPage: React.FC<CoachingViewProps> = ({ coaching }) => {
  return (
    <div className="pb-40">
      <div className="text-2xl font-extrabold flex flex-col justify-center items-center text-center">
        {coaching.id === "6276b8f3-016f-4b24-a6f9-006bfbf41f6e" ? (
          <div
            className="glow-effect"
            style={
              {
                "--glow-color": "#FFD700",
              } as React.CSSProperties
            }
          >
            <Crown size={50} color="#FFD700" className=" icon-shadow " />
          </div>
        ) : (
          <div
            className="glow-effect"
            style={
              {
                "--glow-color": "#48cae4",
              } as React.CSSProperties
            }
          >
            <Atom size={50} color="#48cae4" className=" icon-shadow " />
          </div>
        )}
        <p className=" text-neutral-400 mt-4">BIENVENIDO AL </p>
        <h1 className="text-4xl">{coaching.name.toUpperCase()}</h1>
        <p className=" text-lg mt-2 text-neutral-200 font-normal ">
          Aqui encontras las salas del coaching con las que te podras capacitar
          todos los dias de manera consistente, etc...
        </p>
      </div>
      <div className="mt-12 flex mx-auto justify-center flex-wrap max-w-[1000px] gap-7 px-4">
        {coaching.salas.map((sala) => (
          <Link
            key={sala.id}
            href={`/coaching/${coaching.id}?sala_id=${sala.id}`}
            className="w-[400px] hover:scale-110 cursor-pointer transition-transform px-4 pb-4 relative flex flex-col justify-end h-[200px] rounded-2xl overflow-hidden "
          >
            <Image
              className=" mask-image opacity-90"
              alt={sala.name}
              src={sala.img_url}
              fill
              style={{ objectFit: "cover" }}
            />
            <h2 className="font-extrabold z-10">{sala.name.toUpperCase()}</h2>
          </Link>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center">
        <Link href={"https://chat.whatsapp.com/KRzbLP8kMUmEb3ZJKDp6Aw"}>
          <Button variant="outline" className="mt-12 w-[500px]">
            <WhatsappIcon classname="w-6 mr-2" />
            Acceder al grupo de Calisystem
          </Button>
        </Link>
        <Link href={"https://wa.me/message/VXF6JNGEW5FNP1"}>
          <Button variant="outline" className="mt-4 w-[500px] gap-2">
            <User2 />
            Click aqui para contactarme
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CoachingViewPage;
