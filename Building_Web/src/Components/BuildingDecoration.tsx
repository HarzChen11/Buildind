import React from "react";

const BuildingDecoration = () => {
  return (
    <div className="relative mt-6 w-full max-w-3xl mx-auto">
      {/* 中間固定：樹 - 門 - 樹 */}
      <div className="flex justify-center gap-4 items-end z-10 relative">
        <img src="/assets/tree.svg" alt="tree" className="w-[36px] h-auto" />
        <img src="/assets/door.svg" alt="door" className="w-[50px] h-auto" />
        <img src="/assets/tree.svg" alt="tree" className="w-[44px] h-auto" />
      </div>

      {/* 動態隨機的樹（左右生成） */}
      {Array.from({ length: 10 }).map((_, index) => {
        const side = Math.random() < 0.5 ? "left" : "right";
        const offset = Math.floor(Math.random() * 160);
        const size = Math.floor(Math.random() * 32) + 32;

        return (
          <img
            key={index}
            src="/assets/tree.svg"
            alt={`tree-${index}`}
            className="absolute bottom-0"
            style={{
              [side]: `${offset}px`,
              width: `${size}px`,
              zIndex: 0,
            }}
          />
        );
      })}
    </div>
  );
};

export default BuildingDecoration;
