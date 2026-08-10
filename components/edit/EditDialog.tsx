"use client";
import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface EditDialogInterface {
  buttonTitle: string;
  dialogTitle: string;
  children: ReactNode;
  classname?: string;
  icon?: ReactNode;
  /** When set, the trigger renders a raw button with this class instead of the default outline Button. */
  buttonClassName?: string;
}
const EditDialog = ({
  buttonTitle,
  children,
  dialogTitle,
  classname,
  icon,
  buttonClassName,
}: EditDialogInterface) => {
  return (
    <div className={classname}>
      <Dialog>
        <DialogTrigger asChild>
          {buttonClassName ? (
            <button className={buttonClassName}>
              {icon}
              {buttonTitle}
            </button>
          ) : (
            <Button className="gap-2" variant="outline">
              {icon}
              {buttonTitle}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditDialog;
