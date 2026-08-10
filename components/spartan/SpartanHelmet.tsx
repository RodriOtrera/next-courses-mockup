import React from "react";
import Image from "next/image";

interface SpartanHelmetProps {
  size?: number;
  className?: string;
}

const SpartanHelmet: React.FC<SpartanHelmetProps> = ({
  size = 80,
  className,
}) => {
  return (
    <Image
      src="/spartan-helmet.svg"
      alt="Spartan Helmet"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default SpartanHelmet;
