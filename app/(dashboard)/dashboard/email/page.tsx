import { cn } from "@/lib/utils";
import React from "react";
import EmailComponent from "@/app/(home)/email/EmailComponent";

interface EmailPageProps {}

const EmailPage: React.FC<EmailPageProps> = async ({}) => {


  return (
    <div className={cn("min-h-screen pt-20 flex flex-col px-10")}>
      <EmailComponent />
    </div>
  );
};

export default EmailPage;
