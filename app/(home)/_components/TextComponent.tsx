import { twMerge } from "tailwind-merge";

interface TextComponentProps {
  text: string;
  classname?: string;
}

const TextComponent: React.FC<TextComponentProps> = ({ text, classname }) => {
  return (
    <div className="relative text-left">
      <p
        className={twMerge(
          "absolute left-0 top-0 text-xl text-[#332f2a]  lg:text-3xl xl:text-5xl font-bold",
          classname
        )}
      >
        {text}
      </p>
      <p
        className={twMerge(
          "text text-xl md:h-[50px] lg:text-3xl  xl:h-[70px] xl:text-5xl font-bold",
          classname
        )}
      >
        {text}
      </p>
    </div>
  );
};

export default TextComponent;
