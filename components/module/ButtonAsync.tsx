"use client";
import { useState } from "react";
import { ModuleNavigationI } from "./ModuleNavigation";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

type ButtonAsyncProps<T> = {
  onClick: (navigationTimeline: T) => Promise<void>;
  title: string;
  argument: T;
};

function ButtonAsync<T>({ onClick, title, argument }: ButtonAsyncProps<T>) {
  const [handling, setHandling] = useState(false);

  if (handling) {
    return <Loader2 className="animate-spin red-span " />;
  }
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setHandling(true);
        await onClick(argument);
        setHandling(false);
      }}
    >
      {title}
    </Button>
  );
}

export default ButtonAsync;
