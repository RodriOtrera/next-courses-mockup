import Image from "next/image";
import React from "react";

const RandomComponent = () => {
  return (
    <div
      style={{
        width: "300px",
        height: "200px",
      }}
      className=" px-4 pt-8 rounded-lg   bg-neutral-800"
    >
      <div className="flex items-center">
        <Image
          width={54}
          height={54}
          src={
            "https://lh3.googleusercontent.com/a/ACg8ocLkQ8UpEoZfPbzamkifYIZZrkqZicd5W3TpkI0JLCr6VXCM4mBaxw=s288-c-no"
          }
          className="h-10  w-10  rounded-full  overflow-clip cursor-pointer mr-2 border-spacing-4 object-fit"
          alt="HELLO"
        />

        <h1 className=" text-md font-bold text-white"> Rodri Otrera</h1>
      </div>
      <p className=" text-neutral-300 text-sm mt-2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget nisl
        euismod, aliquam magna eu, ultricies nisi. Sed
      </p>
    </div>
  );
};

export default RandomComponent;
