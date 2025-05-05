import React from "react";

const BuildingDecoration = () => {
  const leftTrees = 10;
  const centerTrees = 11;
  const rightTrees = 10;

  const generateTree = (index: number, position: "left" | "center" | "right") => {
    const size = Math.floor(Math.random() * 20) + 40;
    const top = Math.floor(Math.random() * 20);

    let style: React.CSSProperties = {
      width: `${size}px`,
      top: `${top}px`,
      position: "absolute",
      zIndex: 1,
    };

    if (position === "left") {
      style.left = `${Math.floor(Math.random() * 280)}px`; // 左邊擴寬
    } else if (position === "right") {
      style.right = `${Math.floor(Math.random() * 280)}px`; // 右邊擴寬
    } else if (position === "center") {
      const percentOffset = 25 + Math.random() * 50; // 中間區塊變寬（25% ~ 75%）
      style.left = `${percentOffset}%`;
      style.transform = `translateX(-50%)`;
    }

    return (
      <img
        key={`${position}-${index}`}
        src="/assets/tree.svg"
        alt={`tree-${position}-${index}`}
        style={style}
      />
    );
  };

  return (
    <div className="relative mt-6 w-full max-w-[1200px] mx-auto h-[100px]">
      {Array.from({ length: leftTrees }).map((_, i) => generateTree(i, "left"))}
      {Array.from({ length: centerTrees }).map((_, i) => generateTree(i, "center"))}
      {Array.from({ length: rightTrees }).map((_, i) => generateTree(i, "right"))}
    </div>
  );
};

export default BuildingDecoration;
