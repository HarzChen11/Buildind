import React, { useState } from "react";

// 使用者與樓層資料型別定義
interface User {
  id: string;
  name: string;
  avatar: string;
  floor: number;
}

interface Floor {
  floorNumber: number;
  label: string;
  isPublicSpace: boolean;
}

// 預設樓層資料
const initialFloors: Floor[] = [
  { floorNumber: 105, label: "E 室", isPublicSpace: false },
  { floorNumber: 104, label: "D 室", isPublicSpace: false },
  { floorNumber: 103, label: "C 定", isPublicSpace: false },
  { floorNumber: 100, label: "A 定", isPublicSpace: false },
  { floorNumber: 99, label: "未定", isPublicSpace: false },
  { floorNumber: 5, label: "Gym", isPublicSpace: true },
  { floorNumber: 4, label: "Cinema", isPublicSpace: true },
  { floorNumber: 3, label: "Cafe", isPublicSpace: true },
  { floorNumber: 1, label: "OUTSIDE", isPublicSpace: true },
];

const App = () => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "u001",
    name: "Harz",
    avatar: "🧍‍♀️",
    floor: 103,
  });

  const handleMove = (targetFloor: number) => {
    setCurrentUser((prev) => ({ ...prev, floor: targetFloor }));
  };

  return (
    <div className="min-h-screen bg-[#fdfcf7] flex flex-col items-center justify-center px-4 py-10">

    {/* 註冊/登入選項 */}
    <div className="fixed top-4 right-4 z-50">
    <a
      href="https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=你的ChannelID&redirect_uri=你的RedirectURI&state=abc123&scope=profile%20openid&bot_prompt=normal"
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
        使用 LINE 註冊/登入
      </a>
    </div>

      {/* 建築主體 */}
      <div className="w-full max-w-md border border-gray-700 bg-white shadow-xl">
        {initialFloors
          .sort((a, b) => b.floorNumber - a.floorNumber)
          .map((floor) => (
            <div
              key={floor.floorNumber}
              className="relative border-b border-black h-16 flex items-center justify-between px-4"
            >
              <div className="w-1/5 text-lg font-bold">{floor.floorNumber}F</div>
              <div className="w-2/5 text-lg">{floor.label}</div>

              {/* 使用者站在該樓層 */}
              {floor.floorNumber === currentUser.floor && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">
                  {currentUser.avatar}
                </div>
              )}

              {/* 若是公共空間可移動 */}
              {floor.isPublicSpace && (
                <button
                  onClick={() => handleMove(floor.floorNumber)}
                  className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100"
                >
                  Move to {floor.label}
                </button>
              )}
            </div>
          ))}
      </div>

     {/* 👇 大樓下方的門＋隨機樹區塊（每次刷新都重新隨機） */}
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
    const offset = Math.floor(Math.random() * 160); // 離邊界距離 0~160px
    const size = Math.floor(Math.random() * 32) + 32; // 尺寸在 32~64px

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




    </div>
  );
};

export default App;
