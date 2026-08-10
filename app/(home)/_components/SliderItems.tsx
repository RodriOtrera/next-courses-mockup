import React from "react";

interface SliderItemsProps {
  itemWidth: number;
  itemHeight: number;
  items: Array<React.ReactNode>;
  animationDuration?: number;
}

const SliderItems: React.FC<SliderItemsProps> = ({
  itemHeight,
  itemWidth,
  items,
  animationDuration = 10,
}) => {
  return (
    <div
      style={{
        height: `${itemHeight}px `,
      }}
      className="slider-container  w-full  overflow-x-hidden"
    >
      <div
        style={
          {
            minWidth: `${itemWidth * items.length}px`,
            "--animation-duration": `${animationDuration}s`,
            "--items-quantity": `${items.length}`,
            "--items-width": `${itemWidth}px`,
          } as React.CSSProperties
        }
        className="slider-content   flex w-full relative"
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="slider-item"
            style={
              {
                "--slider-item-index": `${index}`,
              } as React.CSSProperties
            }
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderItems;
